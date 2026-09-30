-- KORA — invitations d'admins, plan Gratuit et paiement SasPay manuel.
-- Corrige aussi deux blocages du flux de paiement et ferme l'activation Business gratuite.
-- Idempotent.

-- 0) is_super_admin : version alignée sur la base (un profil d'accès désactivé ou expiré n'est JAMAIS super admin).
create or replace function public.is_super_admin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text; v_level text; v_active boolean; v_expires_at timestamptz;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is distinct from 'admin' then return false; end if;

  select access_level, is_active, access_expires_at
    into v_level, v_active, v_expires_at
  from public.admin_access_profiles where user_id = auth.uid();

  -- Aucun profil d'accès : compatibilité avec l'admin historique (CEO).
  if not found then return true; end if;
  if coalesce(v_active, false) = false then return false; end if;
  if v_expires_at is not null and v_expires_at <= now() then return false; end if;
  return v_level = 'super_admin';
end;
$$;
revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

-- 1) Invitations d'admins (table + RPC appelée par l'Edge Function admin-users).
create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_user_id uuid references public.profiles(id) on delete set null,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  message text,
  access_level text not null default 'associate' check (access_level in ('associate','super_admin')),
  permissions jsonb not null default '{}'::jsonb,
  max_users integer check (max_users is null or max_users >= 0),
  max_payment_validations integer check (max_payment_validations is null or max_payment_validations >= 0),
  access_expires_at timestamptz,
  scope jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists idx_admin_invitations_email on public.admin_invitations(lower(email));
create index if not exists idx_admin_invitations_status on public.admin_invitations(status);
alter table public.admin_invitations enable row level security;
drop policy if exists admin_invitations_super_select on public.admin_invitations;
drop policy if exists admin_invitations_super_all on public.admin_invitations;
create policy admin_invitations_super_all on public.admin_invitations
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

create or replace function public.register_admin_invitation(
  p_invitation_id uuid, p_invited_user_id uuid, p_email text, p_message text,
  p_access_level text default 'associate', p_permissions jsonb default '{}'::jsonb,
  p_max_users integer default null, p_max_payment_validations integer default null,
  p_access_expires_at timestamptz default null, p_scope jsonb default '{}'::jsonb
)
returns public.admin_invitations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_inv public.admin_invitations;
begin
  if not public.is_super_admin() then raise exception 'Accès Super Admin requis'; end if;
  if p_access_level not in ('associate','super_admin') then raise exception 'Niveau administrateur invalide'; end if;

  update public.profiles set role = 'admin', updated_at = now() where id = p_invited_user_id;
  if not found then raise exception 'Profil invité introuvable'; end if;

  insert into public.admin_access_profiles (user_id, access_level, permissions, max_users,
    max_payment_validations, access_expires_at, scope, is_active, created_by, updated_by)
  values (p_invited_user_id, p_access_level, coalesce(p_permissions,'{}'::jsonb), p_max_users,
    p_max_payment_validations, p_access_expires_at, coalesce(p_scope,'{}'::jsonb), true, auth.uid(), auth.uid())
  on conflict (user_id) do update set
    access_level = excluded.access_level, permissions = excluded.permissions,
    max_users = excluded.max_users, max_payment_validations = excluded.max_payment_validations,
    access_expires_at = excluded.access_expires_at, scope = excluded.scope,
    is_active = true, updated_by = auth.uid(), updated_at = now();

  insert into public.admin_invitations (id, email, invited_user_id, invited_by, message, access_level,
    permissions, max_users, max_payment_validations, access_expires_at, scope, status)
  values (p_invitation_id, lower(trim(p_email)), p_invited_user_id, auth.uid(), p_message, p_access_level,
    coalesce(p_permissions,'{}'::jsonb), p_max_users, p_max_payment_validations, p_access_expires_at,
    coalesce(p_scope,'{}'::jsonb), 'pending')
  returning * into v_inv;

  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, target_user_id, metadata)
  values (auth.uid(), 'admin.invite', 'admin_invitation', p_invitation_id, p_invited_user_id,
    jsonb_build_object('email', lower(trim(p_email)), 'access_level', p_access_level));

  return v_inv;
end;
$$;
revoke all on function public.register_admin_invitation(uuid,uuid,text,text,text,jsonb,integer,integer,timestamptz,jsonb) from public, anon;
grant execute on function public.register_admin_invitation(uuid,uuid,text,text,text,jsonb,integer,integer,timestamptz,jsonb) to authenticated;

-- 2) subscriptions.plan : accepte 'pro' (la grille Gratuit / Pro / Business).
do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid='public.subscriptions'::regclass and contype='c'
             and pg_get_constraintdef(oid) ilike '%plan%' and pg_get_constraintdef(oid) not ilike '%status%'
  loop execute format('alter table public.subscriptions drop constraint %I', c); end loop;
  alter table public.subscriptions add constraint subscriptions_plan_check
    check (plan = any (array['free','trial','standard','premium','pro','business']));
end $$;

-- 3) Plan Gratuit : réservé aux managers, sans expiration, sans écraser un abonnement payant en cours.
create or replace function public.activate_free_plan()
returns public.subscriptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.plans%rowtype;
  v_sub public.subscriptions%rowtype;
  v_now timestamptz := now();
begin
  if v_user is null then raise exception 'Authentification requise' using errcode = '42501'; end if;
  if public.get_my_role() <> 'manager' then raise exception 'Réservé aux managers'; end if;

  select * into v_plan from public.plans where id = 'FREE' and is_active = true limit 1;
  if v_plan.id is null then raise exception 'Plan gratuit introuvable'; end if;

  select * into v_sub from public.subscriptions where user_id = v_user order by created_at desc limit 1 for update;

  if v_sub.id is not null
     and v_sub.status = 'active'
     and upper(coalesce(v_sub.plan_id, '')) in ('PRO','BUSINESS')
     and (v_sub.current_period_end is null or v_sub.current_period_end > v_now) then
    raise exception 'Vous avez un abonnement payant actif. Il doit arriver à échéance avant de passer au plan Gratuit.';
  end if;

  if v_sub.id is null then
    insert into public.subscriptions (user_id, plan, plan_id, status, starts_at, ends_at,
      current_period_start, current_period_end, provider, updated_at)
    values (v_user, 'free', 'FREE', 'active', v_now, null, v_now, null, 'kora', v_now)
    returning * into v_sub;
  else
    update public.subscriptions
    set plan = 'free', plan_id = 'FREE', status = 'active', starts_at = v_now, ends_at = null,
        current_period_start = v_now, current_period_end = null, trial_start = null, trial_end = null,
        provider = 'kora', provider_subscription_id = null, updated_at = v_now
    where id = v_sub.id
    returning * into v_sub;
  end if;
  return v_sub;
end;
$$;
revoke all on function public.activate_free_plan() from public, anon;
grant execute on function public.activate_free_plan() to authenticated;

-- 4) Paiement : le plan Business (5 000 FCFA) était refusé à la création (seul « Pro » passait).
create or replace function public.create_subscription_payment(
  p_plan_id text, p_billing_cycle text default 'monthly', p_provider text default 'unconfigured'
)
returns public.payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.plans%rowtype;
  v_sub public.subscriptions%rowtype;
  v_payment public.payments%rowtype;
  v_ref text;
begin
  if v_user is null then raise exception 'Connexion requise'; end if;

  select * into v_plan from public.plans where id::text = p_plan_id and is_active = true;
  if v_plan.id is null then raise exception 'Plan introuvable'; end if;
  if upper(v_plan.id::text) not in ('PRO','BUSINESS') then
    raise exception 'Ce plan ne nécessite pas de paiement via cette fonction';
  end if;
  if v_plan.price <= 0 then raise exception 'Montant invalide'; end if;

  perform public.ensure_my_manager_subscription();

  select * into v_sub from public.subscriptions where user_id = v_user order by created_at desc limit 1 for update;

  v_ref := 'KORA-SUB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,18));

  insert into public.payments (user_id, subscription_id, plan_id, provider, reference, amount, currency,
    billing_cycle, status, metadata)
  values (v_user, v_sub.id, p_plan_id, coalesce(nullif(p_provider,''),'unconfigured'), v_ref, v_plan.price,
    v_plan.currency, coalesce(nullif(p_billing_cycle,''),'monthly'), 'pending', '{"source":"kora_subscription"}')
  returning * into v_payment;

  return v_payment;
end;
$$;
revoke all on function public.create_subscription_payment(text,text,text) from public, anon;
grant execute on function public.create_subscription_payment(text,text,text) to authenticated;

-- 5) Validation d'un paiement : le plan payé est maintenant réellement appliqué à l'abonnement
--    (avant, seule la période changeait : le manager payait Pro et restait sur Gratuit).
create or replace function public.admin_validate_payment(p_payment_id uuid, p_status text, p_note text default null)
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
  if auth.uid() is null or not public.is_admin() then raise exception 'Accès administrateur requis'; end if;
  if p_payment_id is null then raise exception 'Paiement manquant'; end if;
  if p_status not in ('paid','failed','cancelled','refunded') then raise exception 'Statut de paiement invalide'; end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'Paiement introuvable'; end if;
  v_old_status := v_payment.status;

  update public.payments
  set status = p_status,
      paid_at = case when p_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
      validated_by = auth.uid(),
      validated_at = now(),
      metadata = coalesce(metadata,'{}'::jsonb)
                 || case when p_note is null then '{}'::jsonb else jsonb_build_object('admin_note', p_note) end,
      updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  if p_status = 'paid' and v_payment.subscription_id is not null then
    v_end := v_start + case when lower(coalesce(v_payment.billing_cycle,'monthly')) = 'yearly'
                            then interval '12 months' else interval '1 month' end;
    update public.subscriptions
    set status = 'active',
        plan_id = coalesce(v_payment.plan_id, plan_id),
        plan = lower(coalesce(v_payment.plan_id, plan_id)),
        trial_start = null, trial_end = null,
        current_period_start = v_start,
        current_period_end = v_end,
        updated_at = now()
    where id = v_payment.subscription_id;
  end if;

  if v_old_status is distinct from p_status then
    insert into public.notifications (user_id, type, title, message, data, is_read, created_at)
    values (v_payment.user_id, 'payment', 'Mise à jour du paiement',
      concat('Votre paiement ', coalesce(v_payment.reference, v_payment.id::text), ' est maintenant : ', p_status, '.'),
      jsonb_build_object('payment_id', v_payment.id, 'status', p_status), false, now());
  end if;

  perform public.write_admin_audit_log('payment.status_update','payment', v_payment.id, v_payment.user_id,
    jsonb_build_object('from', v_old_status, 'to', p_status, 'note', p_note));

  return v_payment;
end;
$$;
revoke all on function public.admin_validate_payment(uuid,text,text) from public, anon;
grant execute on function public.admin_validate_payment(uuid,text,text) to authenticated;

-- 6) Business est payant (5 000 FCFA) : plus d'auto-activation par le manager.
--    Le plan s'active uniquement après validation admin du paiement (point 5).
revoke execute on function public.activate_business_plan() from public, anon, authenticated;
