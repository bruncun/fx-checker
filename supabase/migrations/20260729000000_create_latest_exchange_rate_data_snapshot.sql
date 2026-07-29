create table if not exists public.latest_exchange_rate_data_snapshot (
  id text primary key,
  source_date date not null,
  fetched_at timestamptz not null,
  latest_rates jsonb not null,
  daily_3m jsonb not null,
  weekly_1y jsonb not null,
  monthly_5y jsonb not null,
  constraint latest_exchange_rate_data_snapshot_singleton check (id = 'latest'),
  constraint latest_exchange_rate_data_snapshot_latest_rates_array
    check (jsonb_typeof(latest_rates) = 'array' and jsonb_array_length(latest_rates) > 0),
  constraint latest_exchange_rate_data_snapshot_daily_3m_array
    check (jsonb_typeof(daily_3m) = 'array' and jsonb_array_length(daily_3m) > 0),
  constraint latest_exchange_rate_data_snapshot_weekly_1y_array
    check (jsonb_typeof(weekly_1y) = 'array' and jsonb_array_length(weekly_1y) > 0),
  constraint latest_exchange_rate_data_snapshot_monthly_5y_array
    check (jsonb_typeof(monthly_5y) = 'array' and jsonb_array_length(monthly_5y) > 0)
);

alter table public.latest_exchange_rate_data_snapshot enable row level security;

create policy "Anyone can read latest exchange rate data snapshot"
  on public.latest_exchange_rate_data_snapshot
  for select
  to anon, authenticated
  using (id = 'latest');
