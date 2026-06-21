-- ============================================================
--  Shyraq — Kaspi receipt verification schema (Supabase / Postgres)
--  Run in Supabase SQL editor.
-- ============================================================

-- Premium status per user
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  premium_until timestamptz,
  created_at    timestamptz not null default now()
);

-- Order lifecycle
do $$ begin
  create type public.payment_status as enum ('pending','paid','failed','expired');
exception when duplicate_object then null; end $$;

create table if not exists public.payment_orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      integer not null default 990,
  plan        text not null default 'premium_1m',
  status      public.payment_status not null default 'pending',
  provider    text not null default 'kaspi_qr',     -- 'kaspi_qr' | 'receipt_ocr'
  qr_operation_id text,                              -- Kaspi Pay QR operation id
  qr_token    text,                                  -- pay.kaspi.kz link for the QR
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Verified payments. receipt_number is UNIQUE → blocks reuse of the same receipt.
create table if not exists public.payment_transactions (
  id                uuid primary key default gen_random_uuid(),
  payment_order_id  uuid not null references public.payment_orders(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  receipt_number    text not null unique,
  amount            integer not null,
  receiver_name     text,
  paid_at           timestamptz not null,
  created_at        timestamptz not null default now()
);

-- Every attempt (success + failure) for fraud auditing
create table if not exists public.verification_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid,
  payment_order_id  uuid,
  success           boolean not null,
  reason            text,
  ocr_confidence    numeric,
  raw_ocr           jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists idx_orders_user   on public.payment_orders(user_id);
create index if not exists idx_orders_status on public.payment_orders(status);
create index if not exists idx_orders_qrop   on public.payment_orders(qr_operation_id);
create index if not exists idx_tx_receipt    on public.payment_transactions(receipt_number);
create index if not exists idx_logs_user     on public.verification_logs(user_id);

-- ── Row Level Security ──
-- The verification API uses the SERVICE ROLE key, which bypasses RLS.
-- These policies only let end-users (anon key) read their OWN rows.
alter table public.profiles               enable row level security;
alter table public.payment_orders         enable row level security;
alter table public.payment_transactions   enable row level security;
alter table public.verification_logs      enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "own orders" on public.payment_orders;
create policy "own orders" on public.payment_orders
  for select using (auth.uid() = user_id);

drop policy if exists "own tx" on public.payment_transactions;
create policy "own tx" on public.payment_transactions
  for select using (auth.uid() = user_id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
