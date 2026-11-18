-- Saved items: buyers bookmark listings to come back to later.
create table if not exists campusmart.saved (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  listing_id uuid not null references campusmart.listings on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table campusmart.saved enable row level security;
drop policy if exists "own saved read" on campusmart.saved;
drop policy if exists "own saved write" on campusmart.saved;
drop policy if exists "own saved delete" on campusmart.saved;
create policy "own saved read" on campusmart.saved for select to authenticated using (user_id = auth.uid());
create policy "own saved write" on campusmart.saved for insert to authenticated with check (user_id = auth.uid());
create policy "own saved delete" on campusmart.saved for delete to authenticated using (user_id = auth.uid());
grant select, insert, delete on campusmart.saved to authenticated;
