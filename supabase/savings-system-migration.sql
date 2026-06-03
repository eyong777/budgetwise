create extension if not exists "uuid-ossp";

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions alter column type set default 'expense';
update public.transactions set type = 'expense' where type <> 'expense';
alter table public.transactions add constraint transactions_type_check check (type = 'expense');

alter table public.recurring_transactions drop constraint if exists recurring_transactions_type_check;
alter table public.recurring_transactions alter column type set default 'expense';
update public.recurring_transactions set type = 'expense' where type <> 'expense';
alter table public.recurring_transactions add constraint recurring_transactions_type_check check (type = 'expense');

create table if not exists public.savings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monthly_savings numeric(14,2) not null default 0 check (monthly_savings >= 0),
  unused_budget numeric(14,2) not null default 0 check (unused_budget >= 0),
  total_saved numeric(14,2) not null default 0 check (total_saved >= 0),
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2100),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, month, year)
);

create table if not exists public.savings_breakdown (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  saving_id uuid references public.savings(id) on delete cascade,
  category text not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2100),
  created_at timestamptz not null default now(),
  unique (user_id, category, month, year)
);

alter table public.savings enable row level security;
alter table public.savings_breakdown enable row level security;

drop policy if exists "savings are owned by user" on public.savings;
create policy "savings are owned by user" on public.savings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "savings breakdown is owned by user" on public.savings_breakdown;
create policy "savings breakdown is owned by user" on public.savings_breakdown
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists savings_user_month_idx on public.savings(user_id, year, month);
create index if not exists savings_breakdown_user_month_idx on public.savings_breakdown(user_id, year, month);

alter table public.savings
  add column if not exists leftover_wallet numeric(14,2) not null default 0 check (leftover_wallet >= 0);
