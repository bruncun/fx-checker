create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(),
  from_currency text not null,
  to_currency text not null,
  send_amount text not null,
  receive_amount text not null,
  created_at timestamptz not null default now(),
  constraint conversions_from_currency_format check (from_currency ~ '^[A-Z]{3}$'),
  constraint conversions_to_currency_format check (to_currency ~ '^[A-Z]{3}$'),
  constraint conversions_distinct_currency_pair check (from_currency <> to_currency),
  constraint conversions_send_amount_not_empty check (length(trim(send_amount)) > 0),
  constraint conversions_receive_amount_not_empty check (length(trim(receive_amount)) > 0)
);

alter table public.conversions enable row level security;

create policy "Anyone can read conversions"
  on public.conversions
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can create conversions"
  on public.conversions
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can delete conversions"
  on public.conversions
  for delete
  to anon, authenticated
  using (true);

create index if not exists conversions_created_at_idx
  on public.conversions (created_at desc);
