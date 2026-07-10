create table if not exists public.latest_exchange_rate_snapshot (
  id text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null,
  source_updated_at timestamptz,
  constraint latest_exchange_rate_snapshot_singleton check (id = 'latest')
);

alter table public.latest_exchange_rate_snapshot enable row level security;

create policy "Anyone can read latest exchange rate snapshot"
  on public.latest_exchange_rate_snapshot
  for select
  to anon, authenticated
  using (id = 'latest');
