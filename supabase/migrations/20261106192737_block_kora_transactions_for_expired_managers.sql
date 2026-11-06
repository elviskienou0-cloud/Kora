
create or replace function public.create_kora_transaction(
  p_manager_id uuid,
  p_talent_id uuid,
  p_project_id uuid,
  p_amount numeric,
  p_currency text default 'XOF'
)
returns public.kora_transactions
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_client uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_transaction public.kora_transactions%rowtype;
  v_ref text;
begin
  if v_client is null then
    raise exception 'Connexion requise';
  end if;

  if public.get_my_role() <> 'client' then
    raise exception 'Seul un client peut créer une transaction';
  end if;

  if p_manager_id is null or p_amount is null or p_amount <= 0 then
    raise exception 'Transaction invalide';
  end if;

  if p_project_id is null or not exists (
    select 1
    from public.projects
    where id = p_project_id
      and client_id = v_client
      and manager_id = p_manager_id
  ) then
    raise exception 'Projet invalide pour ce manager';
  end if;

  select *
    into v_sub
  from public.subscriptions
  where user_id = p_manager_id
  order by created_at desc
  limit 1;

  if v_sub.id is null then
    raise exception 'Manager non configuré';
  end if;

  -- Un manager expiré ne doit pas pouvoir recevoir de nouvelles transactions.
  if v_sub.status not in ('active', 'trialing')
     or (
       v_sub.current_period_end is not null
       and v_sub.current_period_end <= now()
     ) then
    raise exception 'Le manager doit disposer d''un abonnement actif.';
  end if;

  select *
    into v_plan
  from public.plans
  where id = v_sub.plan_id
    and is_active = true;

  if lower(coalesce(v_plan.name, '')) <> 'business' then
    raise exception 'Le manager doit utiliser le plan Business pour recevoir des transactions KORA';
  end if;

  if p_talent_id is not null and not exists (
    select 1
    from public.talent_profiles
    where id = p_talent_id
      and managed_by = p_manager_id
  ) then
    raise exception 'Talent non rattaché au manager';
  end if;

  v_ref := 'KORA-TXN-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 18));

  insert into public.kora_transactions (
    client_id, manager_id, talent_id, project_id, amount, currency,
    commission_rate, commission_amount, manager_amount, status, reference
  )
  values (
    v_client,
    p_manager_id,
    p_talent_id,
    p_project_id,
    p_amount,
    coalesce(nullif(p_currency, ''), 'XOF'),
    0,
    0,
    p_amount,
    'pending',
    v_ref
  )
  returning * into v_transaction;

  return v_transaction;
end;
$function$;
