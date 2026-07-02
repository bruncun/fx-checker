alter table public.favorites
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.conversions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

delete from public.favorites
where user_id is null;

delete from public.conversions
where user_id is null;

alter table public.favorites
  alter column user_id set default auth.uid(),
  alter column user_id set not null;

alter table public.conversions
  alter column user_id set default auth.uid(),
  alter column user_id set not null;

alter table public.favorites
  drop constraint if exists favorites_currency_pair_unique;

alter table public.favorites
  add constraint favorites_user_currency_pair_unique unique (user_id, from_currency, to_currency);

drop policy if exists "Anyone can read favorites" on public.favorites;
drop policy if exists "Anyone can create favorites" on public.favorites;
drop policy if exists "Anyone can delete favorites" on public.favorites;

create policy "Users can read their own favorites"
  on public.favorites
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can create their own favorites"
  on public.favorites
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own favorites"
  on public.favorites
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Anyone can read conversions" on public.conversions;
drop policy if exists "Anyone can create conversions" on public.conversions;
drop policy if exists "Anyone can delete conversions" on public.conversions;

create policy "Users can read their own conversions"
  on public.conversions
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can create their own conversions"
  on public.conversions
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own conversions"
  on public.conversions
  for delete
  to authenticated
  using (user_id = auth.uid());

create index if not exists favorites_user_id_created_at_idx
  on public.favorites (user_id, created_at);

create index if not exists conversions_user_id_created_at_idx
  on public.conversions (user_id, created_at desc);
