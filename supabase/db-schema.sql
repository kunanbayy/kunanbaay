-- ============================================================
-- Shyraq — Дерекқор: төлемдер, чектер (Storage), параметрлер
-- Supabase → SQL Editor-да осыны бір рет іске қосыңыз.
-- ⚠️ Бұл — демо деңгейдегі (анон рұқсаты ашық) саясаттар, себебі
--    статикалық сайт тек anon кілтпен жұмыс істейді. Production үшін
--    backend (service role) арқылы шектеу ұсынылады.
-- ============================================================

-- ── ТӨЛЕМДЕР ──
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  name        text,
  email       text,
  plan        text,
  amount      integer,
  status      text default 'pending',   -- pending | paid
  receipt_url text,                      -- Storage-тегі чектің сілтемесі
  created_at  timestamptz default now()
);
alter table public.payments enable row level security;

drop policy if exists "payments_insert_any" on public.payments;
create policy "payments_insert_any" on public.payments for insert with check (true);
drop policy if exists "payments_select_any" on public.payments;
create policy "payments_select_any" on public.payments for select using (true);
drop policy if exists "payments_update_any" on public.payments;
create policy "payments_update_any" on public.payments for update using (true);
drop policy if exists "payments_delete_any" on public.payments;
create policy "payments_delete_any" on public.payments for delete using (true);

-- ── ПАРАМЕТРЛЕР (тарифтер т.б. — бір кілт = бір жазба) ──
create table if not exists public.settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz default now()
);
alter table public.settings enable row level security;

drop policy if exists "settings_select_any" on public.settings;
create policy "settings_select_any" on public.settings for select using (true);
drop policy if exists "settings_insert_any" on public.settings;
create policy "settings_insert_any" on public.settings for insert with check (true);
drop policy if exists "settings_update_any" on public.settings;
create policy "settings_update_any" on public.settings for update using (true);

-- ── ҚОЛЖЕТІМДІЛІК (премиум/бұғат — әр қолданушыға, email бойынша) ──
-- Сайт осыны оқып премиумды ашады; admin осыны жазып доступ береді/алады.
create table if not exists public.access (
  email         text primary key,
  premium       boolean default false,
  premium_until timestamptz,
  blocked       boolean default false,
  energy        integer default 0,         -- careerEnergyRemaining: grant.html үшін НАҚТЫ ҚАЛДЫҚ
  energy_total  integer default 0,         -- careerEnergyTotal: барлық берілген (статистика/виджет)
  results_unlocked boolean default false,  -- 990₸ «Толық есеп»: ТЕК results.html (энергия ЕМЕС)
  results_unlocked_at timestamptz,         -- қашан ашылды
  updated_at    timestamptz default now()
);
alter table public.access add column if not exists energy integer default 0;
alter table public.access add column if not exists energy_total integer default 0;
alter table public.access add column if not exists results_unlocked boolean default false;
alter table public.access add column if not exists results_unlocked_at timestamptz;
alter table public.access enable row level security;
drop policy if exists "access_select_any" on public.access;
create policy "access_select_any" on public.access for select using (true);
drop policy if exists "access_insert_any" on public.access;
create policy "access_insert_any" on public.access for insert with check (true);
drop policy if exists "access_update_any" on public.access;
create policy "access_update_any" on public.access for update using (true);

-- ── ХАБАРЛАМАЛАР (admin → барлық тіркелген қолданушы) ──
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  audience    text not null default 'all',
  created_by  text,
  created_at  timestamptz default now()
);
alter table public.notifications enable row level security;
grant select, insert, update, delete on public.notifications to anon, authenticated;

drop policy if exists "notifications_select_any" on public.notifications;
create policy "notifications_select_any" on public.notifications for select using (true);
drop policy if exists "notifications_insert_any" on public.notifications;
create policy "notifications_insert_any" on public.notifications for insert with check (true);

create table if not exists public.notification_reads (
  id              uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  email           text not null,
  is_read         boolean default true,
  read_at         timestamptz default now(),
  created_at      timestamptz default now(),
  unique(notification_id, email)
);
alter table public.notification_reads enable row level security;
grant select, insert, update, delete on public.notification_reads to anon, authenticated;

drop policy if exists "notification_reads_select_any" on public.notification_reads;
create policy "notification_reads_select_any" on public.notification_reads for select using (true);
drop policy if exists "notification_reads_insert_any" on public.notification_reads;
create policy "notification_reads_insert_any" on public.notification_reads for insert with check (true);
drop policy if exists "notification_reads_update_any" on public.notification_reads;
create policy "notification_reads_update_any" on public.notification_reads for update using (true);

-- ── ПРОФИЛЬДЕР: admin панелі барлық тіркелген қолданушыны көру үшін ──
-- (демо деңгей: profiles тек аты/email/қала сақтайды, құпиясөз жоқ)
drop policy if exists "profiles_select_any" on public.profiles;
create policy "profiles_select_any" on public.profiles for select using (true);

-- ── ЧЕКТЕР (Storage bucket: public оқу) ──
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "receipts_read" on storage.objects;
create policy "receipts_read" on storage.objects
  for select using (bucket_id = 'receipts');
drop policy if exists "receipts_insert" on storage.objects;
create policy "receipts_insert" on storage.objects
  for insert with check (bucket_id = 'receipts');
