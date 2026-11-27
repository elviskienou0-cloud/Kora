-- KORA: expiration stricte des abonnements managers.
-- Une période sans date d'expiration valide ne donne jamais accès.
begin;

create or replace function public.ensure_my_manager_subscription()
returns public.subscriptions
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_subscription public.subscriptions%rowtype;
  v_expiry timestamptz;
begin
  if v_user_id is null then
    raise exception 'Connexion requise.' using errcode = '42501';
  end if;

  if public.get_my_role() is distinct from 'manager' then
    raise exception 'Cette fonctionnalité est réservée aux managers actifs.' using errcode = '42501';
  end if;

  select * into v_subscription
  from public.subscriptions
  where user_id = v_user_id
  order by created_at desc
  limit 1
  for update;

  if v_subscription.id is not null then
    v_expiry := case
      when v_subscription.status = 'trialing'
        then coalesce(v_subscription.trial_end, v_subscription.current_period_end, v_subscription.ends_at)
      else coalesce(v_subscription.current_period_end, v_subscription.ends_at)
    end;

    if v_subscription.status in ('trialing', 'active')
       and (v_expiry is null or v_expiry <= now()) then
      update public.subscriptions
      set status = 'expired', updated_at = now()
      where id = v_subscription.id
      returning * into v_subscription;
    end if;
  end if;

  if v_subscription.id is null then
    insert into public.subscriptions (
      user_id, plan_id, status, starts_at, ends_at,
      trial_start, trial_end, current_period_start, current_period_end,
      provider, created_at, updated_at
    )
    values (
      v_user_id, 'FREE', 'trialing', now(), now() + interval '30 days',
      now(), now() + interval '30 days', now(), now() + interval '30 days',
      'kora', now(), now()
    )
    returning * into v_subscription;
  end if;

  return v_subscription;
end;
$function$;

create or replace function public.manager_has_active_plan()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_expiry timestamptz;
begin
  if v_user is null or public.get_my_role() is distinct from 'manager' then
    return false;
  end if;

  v_sub := public.ensure_my_manager_subscription();
  v_expiry := case
    when v_sub.status = 'trialing'
      then coalesce(v_sub.trial_end, v_sub.current_period_end, v_sub.ends_at)
    else coalesce(v_sub.current_period_end, v_sub.ends_at)
  end;

  return v_sub.status in ('trialing', 'active')
    and v_expiry is not null
    and v_expiry > now();
end;
$function$;

revoke all on function public.ensure_my_manager_subscription() from public, anon;
grant execute on function public.ensure_my_manager_subscription() to authenticated, service_role;
revoke all on function public.manager_has_active_plan() from public, anon;
grant execute on function public.manager_has_active_plan() to authenticated, service_role;

commit;
