-- KORA — correctifs majeurs sécurité / règles métier / PostgreSQL
-- 2026-10-05
--
-- Objectifs :
-- 1. empêcher un administrateur associé de modifier/supprimer directement
--    un profil et de contourner les RPC d'administration ;
-- 2. retirer les exécutions anonymes inutiles sur des fonctions SECURITY DEFINER ;
-- 3. corriger les fonctions déclarées STABLE alors qu'elles ont des effets de bord ;
-- 4. supprimer l'ancienne commission projet de 5 % : KORA ne prélève aucune
--    commission sur les projets ;
-- 5. supprimer deux index strictement dupliqués.

BEGIN;

-- ============================================================
-- 1. Sécurité des profils
-- ============================================================

DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own_or_admin ON public.profiles;

CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- La suppression des comptes passe par les Edge Functions sécurisées
-- delete-account / admin-users + les fonctions serveur dédiées.
-- Aucun DELETE direct depuis le Data API n'est autorisé.

REVOKE DELETE ON TABLE public.profiles FROM authenticated;
REVOKE DELETE ON TABLE public.profiles FROM anon;

-- ============================================================
-- 2. Fonctions SECURITY DEFINER : supprimer les accès anon inutiles
-- ============================================================

REVOKE EXECUTE
ON FUNCTION public.create_manager_talent(
  text,
  text,
  text,
  uuid,
  text,
  numeric,
  text
)
FROM public, anon;

REVOKE EXECUTE
ON FUNCTION public.create_manager_talent(
  uuid,
  text,
  text,
  text,
  text,
  uuid,
  uuid,
  text,
  boolean
)
FROM public, anon;

REVOKE EXECUTE
ON FUNCTION public.enforce_manager_talent_limit()
FROM public, anon;

REVOKE EXECUTE
ON FUNCTION public.record_registration_consents()
FROM public, anon;

REVOKE EXECUTE
ON FUNCTION public.set_app_settings_updated_at()
FROM public, anon;

-- ============================================================
-- 3. Volatilité correcte des fonctions
-- ============================================================
-- Ces fonctions appellent notamment ensure_subscription_for_user(),
-- qui peut créer/mettre à jour un abonnement. Elles ne sont donc pas STABLE.

ALTER FUNCTION public.manager_has_feature(text) VOLATILE;
ALTER FUNCTION public.manager_can_add_talent() VOLATILE;
ALTER FUNCTION public.admin_dashboard_overview() VOLATILE;

-- ============================================================
-- 4. Suppression de l'ancienne commission projet KORA
-- ============================================================
-- KORA facture uniquement les abonnements Manager :
-- FREE 30 jours / 1 talent
-- PRO 2 500 XOF / mois / 3 talents
-- BUSINESS 5 000 XOF / mois / talents illimités
-- Aucun prélèvement de 5 % sur les projets.

CREATE OR REPLACE FUNCTION public.create_kora_transaction(
  p_manager_id uuid,
  p_talent_id uuid,
  p_project_id uuid,
  p_amount numeric,
  p_currency text DEFAULT 'XOF'
)
RETURNS public.kora_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
declare
  v_client uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_t public.kora_transactions%rowtype;
  v_ref text;
begin
  if v_client is null then
    raise exception 'Connexion requise';
  end if;

  if public.get_my_role() <> 'client' then
    raise exception 'Seul un client peut créer une transaction';
  end if;

  if p_manager_id is null
     or p_amount is null
     or p_amount <= 0 then
    raise exception 'Transaction invalide';
  end if;

  if p_project_id is null
     or not exists (
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

  select *
  into v_plan
  from public.plans
  where id = v_sub.plan_id
    and is_active = true;

  if lower(coalesce(v_plan.name, '')) <> 'business' then
    raise exception 'Le manager doit utiliser le plan Business pour recevoir des transactions KORA';
  end if;

  if p_talent_id is not null
     and not exists (
       select 1
       from public.talent_profiles
       where id = p_talent_id
         and managed_by = p_manager_id
     ) then
    raise exception 'Talent non rattaché au manager';
  end if;

  v_ref := 'KORA-TXN-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 18));

  insert into public.kora_transactions(
    client_id,
    manager_id,
    talent_id,
    project_id,
    amount,
    currency,
    commission_rate,
    commission_amount,
    manager_amount,
    status,
    reference
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
  returning * into v_t;

  return v_t;
end;
$function$;

REVOKE ALL
ON FUNCTION public.create_kora_transaction(uuid, uuid, uuid, numeric, text)
FROM public, anon;

GRANT EXECUTE
ON FUNCTION public.create_kora_transaction(uuid, uuid, uuid, numeric, text)
TO authenticated;

-- Si un ancien paramètre de commission existe, il est neutralisé.
UPDATE public.app_settings
SET value = '0'::jsonb,
    updated_at = now()
WHERE key = 'commission_rate';

-- ============================================================
-- 5. Index strictement dupliqués
-- ============================================================

DROP INDEX IF EXISTS public.idx_admin_audit_logs_created;
DROP INDEX IF EXISTS public.portfolio_items_talent_id_idx;

COMMIT;
