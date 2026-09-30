-- KORA — SasPay V1 (validation manuelle par Admin)
-- 2026-09-30
-- Plans conservés sur les IDs existants afin de ne pas casser les FK.

update public.plans
set name = 'Gratuit',
    price = 0,
    currency = 'XOF',
    duration_months = 1,
    trial_days = 0,
    is_active = true,
    updated_at = now()
where id = 'FREE';

update public.plans
set name = 'Pro',
    price = 2500,
    currency = 'XOF',
    duration_months = 1,
    trial_days = 0,
    is_active = true,
    updated_at = now()
where id = 'PRO';

update public.plans
set name = 'Premium',
    price = 5000,
    currency = 'XOF',
    duration_months = 1,
    trial_days = 0,
    is_active = true,
    updated_at = now()
where id = 'BUSINESS';

-- Désactive les anciens plans éventuels non utilisés par la nouvelle grille.
update public.plans
set is_active = false,
    updated_at = now()
where id not in ('FREE','PRO','BUSINESS');

-- Activation immédiate du plan gratuit.
create or replace function public.activate_free_plan()
returns public.subscriptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan public.plans%rowtype;
  v_sub public.subscriptions%rowtype;
  v_now timestamptz := now();
  v_end timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentification requise' using errcode='42501';
  end if;

  select * into v_plan
  from public.plans
  where id='FREE' and is_active=true
  limit 1;

  if v_plan.id is null then
    raise exception 'Plan gratuit introuvable';
  end if;

  v_end := v_now + interval '1 month';

  select * into v_sub
  from public.subscriptions
  where user_id=v_user_id
  order by created_at desc
  limit 1
  for update;

  if v_sub.id is null then
    insert into public.subscriptions(
      user_id, plan, plan_id, status,
      starts_at, ends_at,
      current_period_start, current_period_end,
      provider, updated_at
    )
    values(
      v_user_id, 'FREE', 'FREE', 'active',
      v_now, v_end,
      v_now, v_end,
      'kora', v_now
    )
    returning * into v_sub;
  else
    update public.subscriptions
    set plan='FREE',
        plan_id='FREE',
        status='active',
        starts_at=v_now,
        ends_at=v_end,
        current_period_start=v_now,
        current_period_end=v_end,
        provider='kora',
        provider_subscription_id=null,
        updated_at=v_now
    where id=v_sub.id
    returning * into v_sub;
  end if;

  return v_sub;
end;
$$;

revoke all on function public.activate_free_plan() from public, anon;
grant execute on function public.activate_free_plan() to authenticated;
