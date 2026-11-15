-- Everything lives in the "campusmart" schema so this app can share a Supabase project with others.
-- After running, add "campusmart" under Supabase → Project Settings → Data API → Exposed schemas.
create schema if not exists campusmart;
grant usage on schema campusmart to anon, authenticated, service_role;
alter default privileges in schema campusmart grant all on tables to anon, authenticated, service_role;
alter default privileges in schema campusmart grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema campusmart grant execute on functions to anon, authenticated, service_role;

-- CampusMart schema.

create table campusmart.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users on delete cascade default auth.uid(),
  seller_name text not null,
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '',
  price_kobo bigint not null check (price_kobo >= 0),
  category text not null check (category in ('books','electronics','fashion','hostel','food','services','other')),
  condition text not null default 'used' check (condition in ('new','like-new','used')),
  campus text,
  whatsapp text not null,
  image_path text,
  status text not null default 'available' check (status in ('available','sold')),
  created_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored
);

create index listings_search_idx on campusmart.listings using gin (search);
create index listings_feed_idx on campusmart.listings (status, created_at desc);

alter table campusmart.listings enable row level security;
create policy "anyone can browse" on campusmart.listings for select using (true);
create policy "sellers create" on campusmart.listings for insert with check (seller_id = auth.uid());
create policy "sellers update own" on campusmart.listings for update using (seller_id = auth.uid());
create policy "sellers delete own" on campusmart.listings for delete using (seller_id = auth.uid());

-- Public image bucket; users may only write inside a folder named after their user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 3145728, array['image/jpeg','image/png','image/webp']);

create policy "upload own images" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own images" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Table access is still governed by the RLS policies above.
grant all on all tables in schema campusmart to anon, authenticated, service_role;
grant all on all sequences in schema campusmart to anon, authenticated, service_role;
grant execute on all functions in schema campusmart to anon, authenticated, service_role;
