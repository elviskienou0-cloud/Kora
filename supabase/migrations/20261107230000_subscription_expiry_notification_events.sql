-- KORA: idempotent events for subscription expiry notices and email delivery.
-- Email delivery is handled by the subscription-notifications Edge Function.
-- A unique (subscription_id, event_type, expires_at) pair prevents duplicate reminders.

create table if not exists public.subscription_notification_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('expiry_7_days', 'expiry_3_days', 'expired')),
  expires_at timestamptz not null,
  notification_created_at timestamptz,
  email_status text not null default 'pending'
    check (email_status in ('pending', 'sending', 'sent', 'failed')),
  email_attempts integer not null default 0 check (email_attempts >= 0),
  email_sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_notification_events_unique
    unique (subscription_id, event_type)
);

create index if not exists subscription_notification_events_pending_email_idx
  on public.subscription_notification_events (email_status, created_at)
  where email_status in ('pending', 'failed', 'sending');

create index if not exists subscription_notification_events_user_idx
  on public.subscription_notification_events (user_id, created_at desc);

alter table public.subscription_notification_events enable row level security;

revoke all on table public.subscription_notification_events from public, anon, authenticated;
grant select, insert, update on table public.subscription_notification_events to service_role;

comment on table public.subscription_notification_events is
  'Internal idempotency and delivery log for KORA manager subscription expiry notifications. Service-role only.';
