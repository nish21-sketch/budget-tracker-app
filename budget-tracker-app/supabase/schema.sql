-- Budget Tracker — Phase 1 schema
-- Run this once in your Supabase project's SQL editor.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default '₹',
  display_name text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists income (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_amount numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Fixed Deduction', 'Fluid Essential', 'Personal', 'Investment')),
  ideal_plan_amount numeric not null default 0,
  end_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  amount numeric not null,
  month date not null, -- always first-of-month
  note text,
  logged_at timestamptz not null default now()
);

create index if not exists idx_categories_user on categories(user_id);
create index if not exists idx_transactions_user_month on transactions(user_id, month);
create index if not exists idx_transactions_category on transactions(category_id);

-- Row Level Security: every user only ever sees their own rows
alter table profiles enable row level security;
alter table income enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own income" on income for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own categories" on categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own transactions" on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.income (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
