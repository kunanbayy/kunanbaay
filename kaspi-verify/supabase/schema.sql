-- Shyraq payment sessions (Supabase / Postgres)
-- Run once in Supabase SQL Editor, then deploy the kaspi-verify API.

create extension if not exists pgcrypto;

create table if not exists public.tariffs (
  id text primary key,
  name text not null,
  amount integer not null check (amount > 0),
  career_energy integer not null default 0 check (career_energy >= 0),
  premium_days integer not null default 0 check (premium_days >= 0),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.tariffs (id, name, amount, career_energy, premium_days, features)
values
  ('standard', 'Standard', 2990, 1, 0, '["1 толық мамандық анализі","Грант ықтималдығы","Сәйкес университеттер"]'),
  ('career', 'Career Report', 4990, 3, 0, '["3 толық анализ","Career Report","Басым ұсыныстар"]')
on conflict (id) do update set
  name = excluded.name,
  amount = excluded.amount,
  career_energy = excluded.career_energy,
  premium_days = excluded.premium_days,
  features = excluded.features,
  active = true,
  updated_at = now();

do $$ begin
  create type public.payment_method as enum ('qr', 'kaspi_link');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_session_status as enum (
    'pending', 'receipt_uploaded', 'verifying', 'approved', 'rejected', 'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.admin_review_status as enum (
    'pending', 'needs_review', 'auto_approved', 'manual_approved', 'manual_rejected'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tariff_id text not null references public.tariffs(id),
  amount integer not null check (amount > 0),
  payment_method public.payment_method not null,
  payment_reference text not null,
  status public.payment_session_status not null default 'pending',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 minutes'),
  receipt_url text,
  receipt_uploaded_at timestamptz,
  receipt_hash text,
  receipt_paid_at timestamptz,
  receipt_parsed jsonb,
  approved_at timestamptz,
  rejected_reason text,
  admin_review_status public.admin_review_status not null default 'pending',
  qr_operation_id text,
  qr_token text,
  provider_payload jsonb,
  updated_at timestamptz not null default now(),
  constraint payment_session_window check (expires_at > started_at)
);

create unique index if not exists payment_sessions_receipt_hash_unique
  on public.payment_sessions(receipt_hash) where receipt_hash is not null;
create unique index if not exists payment_sessions_qr_operation_unique
  on public.payment_sessions(qr_operation_id) where qr_operation_id is not null;
create unique index if not exists payment_sessions_reference_unique
  on public.payment_sessions(payment_reference);
create index if not exists payment_sessions_user_started_idx
  on public.payment_sessions(user_id, started_at desc);
create index if not exists payment_sessions_status_idx
  on public.payment_sessions(status, expires_at);

create table if not exists public.receipt_audit_logs (
  id uuid primary key default gen_random_uuid(),
  payment_session_id uuid references public.payment_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  success boolean not null default false,
  reason text,
  receipt_hash text,
  extracted jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists receipt_audit_session_idx on public.receipt_audit_logs(payment_session_id);
create index if not exists receipt_audit_hash_idx on public.receipt_audit_logs(receipt_hash);

-- Receipt bucket is private. The API uploads using the server-only service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 10485760,
  array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.tariffs enable row level security;
alter table public.payment_sessions enable row level security;
alter table public.receipt_audit_logs enable row level security;

drop policy if exists "tariffs_read_active" on public.tariffs;
create policy "tariffs_read_active" on public.tariffs for select
  to anon, authenticated using (active = true);

drop policy if exists "payment_sessions_read_own" on public.payment_sessions;
create policy "payment_sessions_read_own" on public.payment_sessions for select
  to authenticated using ((select auth.uid()) = user_id);

-- No client INSERT/UPDATE policies: all mutations go through the authenticated backend.
revoke insert, update, delete on public.payment_sessions from anon, authenticated;
revoke all on public.receipt_audit_logs from anon, authenticated;
grant select on public.tariffs to anon, authenticated;
grant select on public.payment_sessions to authenticated;

-- Atomic approval. Only the service role may execute it.
create or replace function public.approve_payment_session(
  p_session_id uuid,
  p_review_status public.admin_review_status default 'auto_approved'
) returns public.payment_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.payment_sessions;
  t public.tariffs;
  user_email text;
  current_access public.access;
  next_until timestamptz;
begin
  select * into s from public.payment_sessions where id = p_session_id for update;
  if s.id is null then raise exception 'payment_session_not_found'; end if;
  if s.status = 'approved' then return s; end if;
  if s.status = 'expired' or s.receipt_uploaded_at is null then
    update public.payment_sessions set status='expired', updated_at=now() where id=s.id returning * into s;
    raise exception 'payment_session_expired';
  end if;
  if s.receipt_paid_at is null
     or s.receipt_paid_at < (s.started_at - interval '2 minutes')
     or s.receipt_paid_at > (s.expires_at + interval '2 minutes') then
    update public.payment_sessions set status='rejected', rejected_reason='Төлем уақыты сәйкес емес',
      admin_review_status='needs_review', updated_at=now() where id=s.id returning * into s;
    raise exception 'receipt_outside_session';
  end if;

  select * into t from public.tariffs where id=s.tariff_id and active=true;
  if t.id is null then raise exception 'tariff_not_found'; end if;
  select email into user_email from public.profiles where id=s.user_id;
  if user_email is null then select email into user_email from auth.users where id=s.user_id; end if;
  if user_email is null then raise exception 'user_email_not_found'; end if;

  select * into current_access from public.access where lower(email)=lower(user_email) for update;
  if t.premium_days > 0 then
    next_until := greatest(coalesce(current_access.premium_until, now()), now()) + make_interval(days => t.premium_days);
  else
    next_until := current_access.premium_until;
  end if;

  insert into public.access(email, premium, premium_until, blocked, energy, energy_total, updated_at)
  values (lower(user_email), t.premium_days > 0, next_until, false, t.career_energy, t.career_energy, now())
  on conflict (email) do update set
    premium = public.access.premium or (t.premium_days > 0),
    premium_until = coalesce(next_until, public.access.premium_until),
    blocked = false,
    energy = coalesce(public.access.energy,0) + t.career_energy,
    energy_total = coalesce(public.access.energy_total,0) + t.career_energy,
    updated_at = now();

  if t.premium_days > 0 then
    update public.profiles set premium_until=next_until where id=s.user_id;
  end if;

  update public.payment_sessions set
    status='approved', approved_at=now(), rejected_reason=null,
    admin_review_status=p_review_status, updated_at=now()
  where id=s.id returning * into s;
  return s;
end;
$$;

revoke all on function public.approve_payment_session(uuid, public.admin_review_status) from public, anon, authenticated;
grant execute on function public.approve_payment_session(uuid, public.admin_review_status) to service_role;
