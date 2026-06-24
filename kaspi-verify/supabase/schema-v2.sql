-- ============================================================
--  Shyraq — Payment v2 migration (sessions + tariffs + anti-fraud hash)
--  schema.sql-ден КЕЙІН іске қосыңыз (Supabase SQL editor).
--  payment_orders = payment_session ретінде кеңейтіледі.
-- ============================================================

-- 0) profiles бұрыннан бар болса — premium_until бағанын қамтамасыз ету
alter table public.profiles add column if not exists premium_until timestamptz;

-- 1) Жаңа статус: rejected
alter type public.payment_status add value if not exists 'rejected';

-- 2) Тарифтер кестесі (бағалар сервер жағында)
create table if not exists public.tariffs (
  id          text primary key,            -- 'standard' | 'career' | 'report990' ...
  title       text not null,
  amount      integer not null,            -- ₸
  energy      integer not null default 0,  -- берілетін Career Energy
  kind        text not null default 'energy', -- 'energy' | 'results'
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.tariffs (id, title, amount, energy, kind) values
  ('standard',  'Standard',      2990, 1, 'energy'),
  ('career',    'Career Report', 4990, 3, 'energy'),
  ('report990', 'Толық есеп',     990, 0, 'results')
on conflict (id) do update
  set title = excluded.title, amount = excluded.amount,
      energy = excluded.energy, kind = excluded.kind, active = true;

-- 3) payment_orders → толық payment_session өрістері
alter table public.payment_orders
  add column if not exists payment_method      text   default 'qr',   -- 'qr' | 'kaspi_link'
  add column if not exists tariff_id           text,
  add column if not exists expires_at          timestamptz,
  add column if not exists receipt_url         text,
  add column if not exists receipt_uploaded_at timestamptz,
  add column if not exists receipt_hash        text,
  add column if not exists receipt_paid_at     timestamptz,
  add column if not exists approved_at         timestamptz,
  add column if not exists rejected_reason     text,
  add column if not exists admin_review_status text default 'pending'; -- pending|auto_approved|auto_rejected|reviewed_approved|reviewed_rejected

-- Anti-fraud: бір чек (файл хэші) тек 1 рет
create unique index if not exists uq_orders_receipt_hash
  on public.payment_orders (receipt_hash) where receipt_hash is not null;

create index if not exists idx_orders_user_status on public.payment_orders(user_id, status);

-- 4) Чектен оқылған деректер (admin көрінісі үшін)
alter table public.payment_orders
  add column if not exists payer_name text,
  add column if not exists receipt_comment text,
  add column if not exists receiver_name text,
  add column if not exists receipt_amount integer;

-- 5) Чек аудиті (verification_logs кеңейтілді)
alter table public.verification_logs
  add column if not exists receipt_hash text;
