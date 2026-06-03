create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'bank',
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  category text not null,
  type text not null default 'expense' check (type = 'expense'),
  amount numeric(14,2) not null check (amount >= 0),
  description text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  limit_amount numeric(14,2) not null check (limit_amount >= 0),
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2100),
  created_at timestamptz not null default now(),
  unique (user_id, category, month, year)
);

create table if not exists public.savings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monthly_savings numeric(14,2) not null default 0 check (monthly_savings >= 0),
  unused_budget numeric(14,2) not null default 0 check (unused_budget >= 0),
  leftover_wallet numeric(14,2) not null default 0 check (leftover_wallet >= 0),
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

create table if not exists public.recurring_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  type text not null default 'expense' check (type = 'expense'),
  category text not null,
  amount numeric(14,2) not null check (amount >= 0),
  description text,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  next_run date not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings enable row level security;
alter table public.savings_breakdown enable row level security;
alter table public.recurring_transactions enable row level security;

create policy "profiles are owned by user" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "wallets are owned by user" on public.wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions are owned by user" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets are owned by user" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "savings are owned by user" on public.savings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "savings breakdown is owned by user" on public.savings_breakdown
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recurring transactions are owned by user" on public.recurring_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index if not exists wallets_user_id_idx on public.wallets(user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, date desc);
create index if not exists budgets_user_month_idx on public.budgets(user_id, year, month);
create index if not exists savings_user_month_idx on public.savings(user_id, year, month);
create index if not exists savings_breakdown_user_month_idx on public.savings_breakdown(user_id, year, month);
