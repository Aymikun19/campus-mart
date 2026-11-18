-- 002: buyer-seller messaging (text, voice notes, images), multiple listing photos, confirmed sales.

-- Listings: up to 5 photos, and who it was sold to
alter table campusmart.listings
  add column if not exists image_paths text[] not null default '{}',
  add column if not exists sold_to uuid references auth.users on delete set null,
  add column if not exists sale_status text not null default 'none',
  add column if not exists sold_at timestamptz;
alter table campusmart.listings drop constraint if exists listings_image_paths_max;
alter table campusmart.listings add constraint listings_image_paths_max check (cardinality(image_paths) <= 5);
alter table campusmart.listings drop constraint if exists listings_sale_status_check;
alter table campusmart.listings add constraint listings_sale_status_check check (sale_status in ('none', 'pending', 'confirmed'));
alter table campusmart.listings drop constraint if exists listings_not_sold_to_self;
alter table campusmart.listings add constraint listings_not_sold_to_self check (sold_to is null or sold_to <> seller_id);
update campusmart.listings set image_paths = array[image_path] where image_path is not null and cardinality(image_paths) = 0;

-- Only the buyer can confirm a purchase, and a confirmed sale cannot be reassigned.
create or replace function campusmart.guard_sale() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.sale_status = 'confirmed' and old.sale_status is distinct from 'confirmed' and auth.uid() is distinct from new.sold_to then
    raise exception 'Only the buyer can confirm a purchase';
  end if;
  if old.sale_status = 'confirmed' and (new.sale_status <> 'confirmed' or new.sold_to is distinct from old.sold_to or new.status <> 'sold') then
    raise exception 'A confirmed sale cannot be changed';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_sale on campusmart.listings;
create trigger guard_sale before update on campusmart.listings for each row execute function campusmart.guard_sale();

-- Conversations: one per buyer per listing
create table if not exists campusmart.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references campusmart.listings on delete cascade,
  buyer_id uuid not null references auth.users on delete cascade,
  seller_id uuid not null references auth.users on delete cascade,
  buyer_name text not null,
  seller_name text not null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  buyer_read_at timestamptz not null default now(),
  seller_read_at timestamptz not null default 'epoch',
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);
create index if not exists conversations_buyer on campusmart.conversations (buyer_id, last_message_at desc);
create index if not exists conversations_seller on campusmart.conversations (seller_id, last_message_at desc);
alter table campusmart.conversations enable row level security;
drop policy if exists "participants read conversations" on campusmart.conversations;
create policy "participants read conversations" on campusmart.conversations for select to authenticated
  using (auth.uid() in (buyer_id, seller_id));

create table if not exists campusmart.chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references campusmart.conversations on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'voice', 'image')),
  body text not null default '' check (char_length(body) <= 2000 and (kind <> 'text' or char_length(body) >= 1)),
  attachment_path text,
  duration_sec int,
  created_at timestamptz not null default now(),
  check (kind = 'text' or attachment_path is not null)
);
create index if not exists chat_messages_thread on campusmart.chat_messages (conversation_id, created_at);
alter table campusmart.chat_messages enable row level security;

create or replace function campusmart.is_participant(p_conv uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from campusmart.conversations c where c.id = p_conv and auth.uid() in (c.buyer_id, c.seller_id));
$$;

drop policy if exists "participants read messages" on campusmart.chat_messages;
create policy "participants read messages" on campusmart.chat_messages for select to authenticated
  using (campusmart.is_participant(conversation_id));
drop policy if exists "participants send as themselves" on campusmart.chat_messages;
create policy "participants send as themselves" on campusmart.chat_messages for insert to authenticated
  with check (sender_id = auth.uid() and campusmart.is_participant(conversation_id));

-- Keep the inbox preview and the sender's read marker up to date.
create or replace function campusmart.after_chat_message() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update campusmart.conversations c set
    last_message_at = new.created_at,
    last_message_preview = case new.kind when 'voice' then 'Voice note' when 'image' then 'Photo' else left(new.body, 120) end,
    buyer_read_at = case when new.sender_id = c.buyer_id then new.created_at else c.buyer_read_at end,
    seller_read_at = case when new.sender_id = c.seller_id then new.created_at else c.seller_read_at end
  where c.id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists after_chat_message on campusmart.chat_messages;
create trigger after_chat_message after insert on campusmart.chat_messages for each row execute function campusmart.after_chat_message();

create or replace function campusmart.display_name(p_user uuid) returns text
language sql stable security definer set search_path = ''
as $$
  select coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1), 'Student')
  from auth.users u where u.id = p_user;
$$;
revoke all on function campusmart.display_name(uuid) from public, anon, authenticated;

-- Start (or reopen) a conversation with a listing's seller.
create or replace function campusmart.start_conversation(p_listing uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare l campusmart.listings; cid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into l from campusmart.listings where id = p_listing;
  if l.id is null then raise exception 'Listing not found'; end if;
  if l.seller_id = auth.uid() then raise exception 'This is your own listing'; end if;
  select id into cid from campusmart.conversations where listing_id = p_listing and buyer_id = auth.uid();
  if cid is null then
    insert into campusmart.conversations (listing_id, buyer_id, seller_id, buyer_name, seller_name)
    values (p_listing, auth.uid(), l.seller_id, campusmart.display_name(auth.uid()), l.seller_name)
    returning id into cid;
  end if;
  return cid;
end;
$$;

create or replace function campusmart.mark_read(p_conv uuid) returns void
language sql security definer set search_path = ''
as $$
  update campusmart.conversations set
    buyer_read_at = case when buyer_id = auth.uid() then now() else buyer_read_at end,
    seller_read_at = case when seller_id = auth.uid() then now() else seller_read_at end
  where id = p_conv and auth.uid() in (buyer_id, seller_id);
$$;

-- Seller marks an item sold, optionally to a buyer they have been chatting with.
create or replace function campusmart.mark_sold(p_listing uuid, p_buyer uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare cid uuid;
begin
  if not exists (select 1 from campusmart.listings where id = p_listing and seller_id = auth.uid()) then
    raise exception 'Only the seller can mark this as sold';
  end if;
  if p_buyer is not null then
    select id into cid from campusmart.conversations where listing_id = p_listing and buyer_id = p_buyer;
    if cid is null then raise exception 'You can only choose a buyer who messaged you about this item'; end if;
  end if;
  update campusmart.listings set status = 'sold', sold_to = p_buyer, sold_at = now(),
    sale_status = case when p_buyer is null then 'none' else 'pending' end
  where id = p_listing;
  if cid is not null then
    insert into campusmart.chat_messages (conversation_id, sender_id, body)
    values (cid, auth.uid(), 'I have marked this item as sold to you. Please tap "Confirm I received it" once you have it.');
  end if;
end;
$$;

create or replace function campusmart.confirm_purchase(p_listing uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare cid uuid;
begin
  if not exists (select 1 from campusmart.listings where id = p_listing and sold_to = auth.uid() and sale_status = 'pending') then
    raise exception 'There is no pending sale for you to confirm';
  end if;
  update campusmart.listings set sale_status = 'confirmed' where id = p_listing;
  select id into cid from campusmart.conversations where listing_id = p_listing and buyer_id = auth.uid();
  if cid is not null then
    insert into campusmart.chat_messages (conversation_id, sender_id, body) values (cid, auth.uid(), 'Confirmed: I have received the item. Thank you!');
  end if;
end;
$$;

create or replace function campusmart.relist(p_listing uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update campusmart.listings set status = 'available', sold_to = null, sold_at = null, sale_status = 'none'
  where id = p_listing and seller_id = auth.uid() and sale_status <> 'confirmed';
  if not found then raise exception 'Confirmed sales cannot be relisted'; end if;
end;
$$;

revoke all on function campusmart.start_conversation(uuid), campusmart.mark_read(uuid), campusmart.mark_sold(uuid, uuid),
  campusmart.confirm_purchase(uuid), campusmart.relist(uuid) from public, anon;
grant execute on function campusmart.start_conversation(uuid), campusmart.mark_read(uuid), campusmart.mark_sold(uuid, uuid),
  campusmart.confirm_purchase(uuid), campusmart.relist(uuid), campusmart.is_participant(uuid) to authenticated;

-- Private media for chats: chat-media/<conversation_id>/<user_id>/<file>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 8388608,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "participants read chat media" on storage.objects;
create policy "participants read chat media" on storage.objects for select to authenticated
  using (bucket_id = 'chat-media' and campusmart.is_participant(((storage.foldername(name))[1])::uuid));
drop policy if exists "participants upload chat media" on storage.objects;
create policy "participants upload chat media" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-media' and (storage.foldername(name))[2] = auth.uid()::text
              and campusmart.is_participant(((storage.foldername(name))[1])::uuid));

alter publication supabase_realtime add table campusmart.chat_messages, campusmart.conversations;

grant all on all tables in schema campusmart to anon, authenticated, service_role;
grant all on all sequences in schema campusmart to anon, authenticated, service_role;
