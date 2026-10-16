-- KORA: automatic 30-day subscription expiration and server-side enforcement.
-- Paid/free cycles start only when the subscription is activated/validated.

create or replace function public.expire_due_subscriptions()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.subscriptions
     set status = 'expired',
         updated_at = now()
   where status in ('active', 'trialing')
     and (
       (status = 'trialing' and coalesce(trial_end, current_period_end, ends_at) <= now())
       or
       (status = 'active' and coalesce(current_period_end, ends_at) <= now())
     );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_due_subscriptions() from public, anon, authenticated;
grant execute on function public.expire_due_subscriptions() to service_role;

-- Make subscription status truthful even when a user never opens KORA.
create extension if not exists pg_cron;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'kora-expire-subscriptions-every-minute'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'kora-expire-subscriptions-every-minute',
    '* * * * *',
    'select public.expire_due_subscriptions();'
  );
end;
$$;

-- Align the manager subscription getter with the same 30-day boundary.
create or replace function public.get_my_subscription()
returns table(
  subscription_id uuid,
  plan_id text,
  plan_name text,
  plan_price numeric,
  currency text,
  status text,
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  talent_limit integer,
  features jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
begin
  v_sub := public.ensure_my_subscription();

  if v_sub.status in ('trialing', 'active')
     and coalesce(
       case when v_sub.status = 'trialing' then v_sub.trial_end end,
       v_sub.current_period_end,
       v_sub.ends_at
     ) <= now() then
    update public.subscriptions
       set status = 'expired', updated_at = now()
     where id = v_sub.id
     returning * into v_sub;
  end if;

  select * into v_plan from public.plans where id = v_sub.plan_id;

  return query
  select v_sub.id, v_plan.id, v_plan.name, v_plan.price, v_plan.currency,
         v_sub.status, v_sub.trial_start, v_sub.trial_end,
         v_sub.current_period_start, v_sub.current_period_end,
         v_plan.talent_limit, v_plan.features;
end;
$$;

-- Paid subscriptions are 30 days, not calendar-month dependent.
create or replace function public.admin_validate_payment(
  p_payment_id uuid,
  p_status text,
  p_note text default null
)
returns public.payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_old_status text;
  v_start timestamptz := now();
  v_end timestamptz;
begin
  perform public.admin_require_permission('payments.validate');

  if p_payment_id is null then raise exception 'Paiement manquant'; end if;
  if p_status not in ('paid','failed','cancelled','refunded') then
    raise exception 'Statut de paiement invalide';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'Paiement introuvable'; end if;
  v_old_status := v_payment.status;

  update public.payments
     set status = p_status,
         paid_at = case when p_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
         validated_by = auth.uid(),
         validated_at = now(),
         metadata = coalesce(metadata, '{}'::jsonb)
           || case when p_note is null then '{}'::jsonb else jsonb_build_object('admin_note', p_note) end,
         updated_at = now()
   where id = p_payment_id
   returning * into v_payment;

  if p_status = 'paid' and v_payment.subscription_id is not null then
    v_end := v_start + interval '30 days';
    update public.subscriptions
       set status = 'active',
           plan_id = coalesce(v_payment.plan_id, plan_id),
           plan = lower(coalesce(v_payment.plan_id, plan_id)),
           starts_at = v_start,
           ends_at = v_end,
           trial_start = null,
           trial_end = null,
           current_period_start = v_start,
           current_period_end = v_end,
           updated_at = now()
     where id = v_payment.subscription_id;
  end if;

  if v_old_status is distinct from p_status then
    insert into public.notifications (user_id, type, title, message, data, is_read, created_at)
    values (
      v_payment.user_id, 'payment', 'Mise à jour du paiement',
      concat('Votre paiement ', coalesce(v_payment.reference, v_payment.id::text), ' est maintenant : ', p_status, '.'),
      jsonb_build_object('payment_id', v_payment.id, 'status', p_status), false, now()
    );
  end if;

  perform public.write_admin_audit_log_internal(
    'payment.status_update', 'payment', v_payment.id, v_payment.user_id,
    jsonb_build_object('from', v_old_status, 'to', p_status, 'note', p_note)
  );

  return v_payment;
end;
$$;

revoke all on function public.admin_validate_payment(uuid, text, text) from public, anon;
grant execute on function public.admin_validate_payment(uuid, text, text) to authenticated;
