-- =====================================================================
-- 002: Persistent usage limits + Pro plan billing (PayPal)
-- - usage_counters : atomic per-key/per-period counters (server only)
-- - user_plans     : current plan per user (Pro expiry)
-- - payments       : PayPal captures (unique order id => no replay)
-- =====================================================================

-- 1. Usage counters (written ONLY by the service role from API routes)
create table if not exists public.usage_counters (
  key         text        not null,
  period      text        not null,          -- e.g. '2026-10-31' (day) or 'pro:2026-10-31' (billing period)
  count       integer     not null default 0 check (count >= 0),
  updated_at  timestamptz not null default now(),
  primary key (key, period)
);

alter table public.usage_counters enable row level security;
revoke all on public.usage_counters from anon, authenticated;

-- 2. User plans
create table if not exists public.user_plans (
  user_id          uuid        primary key references auth.users (id) on delete cascade,
  plan             text        not null default 'free' check (plan in ('free', 'pro')),
  pro_until        timestamptz,
  period_start     timestamptz,
  updated_at       timestamptz not null default now()
);

alter table public.user_plans enable row level security;
revoke all on public.user_plans from anon;
revoke insert, update, delete on public.user_plans from authenticated;
grant select on public.user_plans to authenticated;

drop policy if exists "user_plans_select_own" on public.user_plans;
create policy "user_plans_select_own" on public.user_plans
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 3. Payments (idempotency: a PayPal order can only be credited once)
create table if not exists public.payments (
  id               bigint generated always as identity primary key,
  user_id          uuid        not null references auth.users (id) on delete cascade,
  provider         text        not null default 'paypal',
  provider_order_id text       not null unique,
  amount           numeric(10,2) not null,
  currency         text        not null,
  status           text        not null,
  plan             text        not null default 'pro',
  raw              jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments (user_id);

alter table public.payments enable row level security;
revoke all on public.payments from anon;
revoke insert, update, delete on public.payments from authenticated;
grant select on public.payments to authenticated;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Atomic "consume one unit if under limit".
--    Returns the new count, or NULL when the limit is already reached.
create or replace function public.consume_usage(p_key text, p_period text, p_limit integer)
returns integer
language sql
security invoker
set search_path = ''
as $$
  insert into public.usage_counters as uc (key, period, count, updated_at)
  values (p_key, p_period, 1, now())
  on conflict (key, period) do update
    set count = uc.count + 1, updated_at = now()
    where uc.count < p_limit
  returning uc.count;
$$;

revoke execute on function public.consume_usage(text, text, integer) from public, anon, authenticated;
grant execute on function public.consume_usage(text, text, integer) to service_role;

-- 5. Give back one unit (used when the AI request fails after consuming)
create or replace function public.refund_usage(p_key text, p_period text)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.usage_counters
     set count = greatest(count - 1, 0), updated_at = now()
   where key = p_key and period = p_period;
$$;

revoke execute on function public.refund_usage(text, text) from public, anon, authenticated;
grant execute on function public.refund_usage(text, text) to service_role;

-- 6. Housekeeping index for cleanup of old daily counters
create index if not exists usage_counters_updated_at_idx on public.usage_counters (updated_at);
