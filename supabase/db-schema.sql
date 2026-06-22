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
