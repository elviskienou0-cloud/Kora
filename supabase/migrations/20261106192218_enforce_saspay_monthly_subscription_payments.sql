
create or replace function public.create_subscription_payment(
  p_plan_id text,
  p_billing_cycle text default 'monthly',
  p_provider text default 'unconfigured'
)
returns public.payments
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.plans%rowtype;
  v_sub public.subscriptions%rowtype;
  v_payment public.payments%rowtype;
  v_ref text;
begin
  if v_user is null then
    raise exception 'Connexion requise';
  end if;

  if lower(coalesce(nullif(trim(p_billing_cycle), ''), 'monthly')) <> 'monthly' then
    raise exception 'KORA utilise actuellement un abonnement mensuel.';
  end if;

  if lower(coalesce(nullif(trim(p_provider), ''), '')) <> 'saspay' then
    raise exception 'Le seul prestataire de paiement autorisé est SasPay.';
  end if;

  select *
    into v_plan
  from public.plans
  where id::text = p_plan_id
    and is_active = true;

  if v_plan.id is null then
    raise exception 'Plan introuvable';
  end if;

  if upper(v_plan.id::text) not in ('PRO', 'BUSINESS') then
    raise exception 'Ce plan ne nécessite pas de paiement via cette fonction';
  end if;

  if v_plan.price <= 0 then
    raise exception 'Montant invalide';
  end if;

  perform public.ensure_my_manager_subscription();

  select *
    into v_sub
  from public.subscriptions
  where user_id = v_user
  order by created_at desc
  limit 1
  for update;

  v_ref := 'KORA-SUB-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 18));

  insert into public.payments (
    user_id, subscription_id, plan_id, provider, reference, amount, currency,
    billing_cycle, status, metadata
  )
  values (
    v_user, v_sub.id, p_plan_id, 'saspay', v_ref, v_plan.price, v_plan.currency,
    'monthly', 'pending', '{"source":"kora_subscription"}'::jsonb
  )
  returning * into v_payment;

  return v_payment;
end;
$function$;
