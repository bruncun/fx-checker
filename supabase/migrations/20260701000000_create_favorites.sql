create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  from_currency text not null,
  to_currency text not null,
  created_at timestamptz not null default now(),
  constraint favorites_from_currency_format check (from_currency ~ '^[A-Z]{3}$'),
  constraint favorites_to_currency_format check (to_currency ~ '^[A-Z]{3}$'),
  constraint favorites_distinct_currency_pair check (from_currency <> to_currency),
  constraint favorites_currency_pair_unique unique (from_currency, to_currency)
);

alter table public.favorites enable row level security;

create policy "Anyone can read favorites"
  on public.favorites
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can create favorites"
  on public.favorites
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can delete favorites"
  on public.favorites
  for delete
  to anon, authenticated
  using (true);

create index if not exists favorites_created_at_idx
  on public.favorites (created_at);
