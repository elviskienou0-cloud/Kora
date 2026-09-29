-- KORA — durcissement sécurité (audit 2026-09-28)
-- Idempotent. Toutes les modifications sont dans une seule transaction.

-- 1) Conversations : plus d'ajout direct de participants depuis le client.
--    La création passe par create_direct_conversation() (SECURITY DEFINER),
--    qui impose Client <-> Manager. L'ancienne policy permettait à tout
--    utilisateur de s'ajouter à une conversation existante (accès aux messages).
drop policy if exists conversation_participants_insert on public.conversation_participants;

-- 2) Paiements : plus d'INSERT direct (statut/montant libres).
--    Création via create_subscription_payment() uniquement.
drop policy if exists payments_insert on public.payments;

-- 3) Paiements : la contrainte de statut refusait 'paid'/'failed'/'cancelled',
--    utilisés par admin_validate_payment() et apply_payment_webhook().
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.payments'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.payments drop constraint %I', c);
  end loop;
  alter table public.payments add constraint payments_status_check
    check (status = any (array['pending','approved','rejected','refunded','paid','failed','cancelled']));
end $$;

-- 4) Messages : seul read_at peut changer (corps, expéditeur, date immuables).
create or replace function public.protect_message_immutable()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user <> 'authenticated' or auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.body is distinct from old.body
     or new.sender_id is distinct from old.sender_id
     or new.conversation_id is distinct from old.conversation_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Un message ne peut pas être modifié';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_message_immutable on public.messages;
create trigger trg_protect_message_immutable
  before update on public.messages
  for each row execute function public.protect_message_immutable();

-- 5) Talents : champs de modération réservés (verified, rating, compteurs),
--    publication soumise à un abonnement actif, statut 'suspended' réservé à l'admin.
--    SECURITY INVOKER : current_user = 'authenticated' pour un appel direct,
--    propriétaire de la fonction pour les RPC SECURITY DEFINER (avis, etc.).
create or replace function public.protect_talent_profile_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare v_sub public.subscriptions%rowtype;
begin
  if current_user <> 'authenticated' or auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified := false;
    new.rating := 0;
    new.reviews_count := 0;
    new.completed_projects := 0;
    new.status := 'pending';
    new.is_visible := false;
    return new;
  end if;

  if new.managed_by is distinct from old.managed_by then
    raise exception 'Le manager d''un talent ne peut pas être modifié';
  end if;
  if new.verified is distinct from old.verified
     or new.rating is distinct from old.rating
     or new.reviews_count is distinct from old.reviews_count
     or new.completed_projects is distinct from old.completed_projects then
    raise exception 'Champ réservé à la modération KORA';
  end if;

  if new.status is distinct from old.status then
    if old.status = 'suspended' or new.status = 'suspended' then
      raise exception 'Ce statut est géré par la modération KORA';
    end if;
    if new.status = 'published' then
      select * into v_sub from public.subscriptions
        where user_id = old.managed_by order by created_at desc limit 1;
      if v_sub.id is null
         or v_sub.status not in ('trialing','active')
         or (v_sub.current_period_end is not null and v_sub.current_period_end <= now()) then
        raise exception 'Un abonnement actif est requis pour publier un talent';
      end if;
    end if;
  end if;

  if new.status <> 'published' then
    new.is_visible := false;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_protect_talent_profile_fields on public.talent_profiles;
create trigger trg_protect_talent_profile_fields
  before insert or update on public.talent_profiles
  for each row execute function public.protect_talent_profile_fields();

-- 6) Profils : un utilisateur suspendu ne peut plus se réactiver lui-même.
create or replace function public.protect_profile_identity_and_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Modification de id interdite';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'Modification de created_at interdite';
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Modification du rôle interdite';
  end if;
  if auth.uid() is not null and not public.is_admin() then
    if new.is_suspended is distinct from old.is_suspended
       or new.suspended_at is distinct from old.suspended_at
       or new.suspended_reason is distinct from old.suspended_reason then
      raise exception 'Modification du statut de suspension interdite';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- 7) Transactions KORA : réservées aux clients, projet obligatoire et cohérent.
create or replace function public.create_kora_transaction(
  p_manager_id uuid, p_talent_id uuid, p_project_id uuid, p_amount numeric, p_currency text default 'XOF'
)
returns public.kora_transactions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_client uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_t public.kora_transactions%rowtype;
  v_comm numeric; v_manager numeric; v_ref text;
begin
  if v_client is null then raise exception 'Connexion requise'; end if;
  if public.get_my_role() <> 'client' then raise exception 'Seul un client peut créer une transaction'; end if;
  if p_manager_id is null or p_amount is null or p_amount <= 0 then raise exception 'Transaction invalide'; end if;
  if p_project_id is null or not exists (
    select 1 from public.projects
    where id = p_project_id and client_id = v_client and manager_id = p_manager_id
  ) then raise exception 'Projet invalide pour ce manager'; end if;
  select * into v_sub from public.subscriptions where user_id = p_manager_id order by created_at desc limit 1;
  if v_sub.id is null then raise exception 'Manager non configuré'; end if;
  select * into v_plan from public.plans where id = v_sub.plan_id and is_active = true;
  if lower(coalesce(v_plan.name,'')) <> 'business' then
    raise exception 'Le manager doit utiliser le plan Business pour recevoir des transactions KORA';
  end if;
  if p_talent_id is not null and not exists (
    select 1 from public.talent_profiles where id = p_talent_id and managed_by = p_manager_id
  ) then raise exception 'Talent non rattaché au manager'; end if;
  v_comm := round(p_amount * 0.05, 0);
  v_manager := p_amount - v_comm;
  v_ref := 'KORA-TXN-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,18));
  insert into public.kora_transactions(client_id, manager_id, talent_id, project_id, amount, currency,
    commission_rate, commission_amount, manager_amount, status, reference)
  values (v_client, p_manager_id, p_talent_id, p_project_id, p_amount,
    coalesce(nullif(p_currency,''),'XOF'), 5, v_comm, v_manager, 'pending', v_ref)
  returning * into v_t;
  return v_t;
end;
$$;
revoke all on function public.create_kora_transaction(uuid,uuid,uuid,numeric,text) from public, anon;
grant execute on function public.create_kora_transaction(uuid,uuid,uuid,numeric,text) to authenticated;

-- 8) Fonctions de trigger : inutile de les exposer en RPC.
revoke execute on function public.enforce_project_workflow() from public, anon, authenticated;
revoke execute on function public.prevent_role_escalation() from public, anon, authenticated;
revoke execute on function public.protect_profile_identity_and_role() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
