-- KORA — mêmes fonctionnalités pour FREE, PRO et BUSINESS
-- FREE  : 1 talent
-- PRO   : 3 talents
-- BUSINESS : talents illimités
--
-- Aucune donnée utilisateur n'est supprimée.
-- Les limites de talents restent inchangées.

BEGIN;

-- ============================================================
-- 1. Mêmes fonctionnalités pour les 3 plans
-- ============================================================

UPDATE public.plans
SET
  features = jsonb_build_array(
    'Gestion des talents',
    'Profil talent',
    'Portfolio et médias',
    'Gestion du cachet',
    'Gestion des demandes',
    'Messagerie',
    'Notifications',
    'Gestion des projets',
    'Profil manager',
    'Organisation du portefeuille de talents'
  ),
  updated_at = now()
WHERE id IN ('FREE', 'PRO', 'BUSINESS');


-- ============================================================
-- 2. Fonction serveur : mêmes fonctionnalités pour les 3 plans
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_manager_plan_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_plan_id text;
  v_active boolean := false;
BEGIN

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Connexion requise'
      USING errcode = '42501';
  END IF;

  IF public.get_my_role() <> 'manager' THEN
    RAISE EXCEPTION 'Compte manager requis'
      USING errcode = '42501';
  END IF;

  v_sub := public.ensure_my_manager_subscription();

  v_plan_id :=
    upper(coalesce(v_sub.plan_id, v_sub.plan, 'FREE'));

  v_active :=
    v_sub.status IN ('trialing', 'active')
    AND (
      v_sub.current_period_end IS NULL
      OR v_sub.current_period_end > now()
    );

  SELECT *
  INTO v_plan
  FROM public.plans
  WHERE id = v_plan_id
    AND is_active = true
  LIMIT 1;

  IF v_plan.id IS NULL THEN
    v_plan_id := 'FREE';

    SELECT *
    INTO v_plan
    FROM public.plans
    WHERE id = 'FREE'
      AND is_active = true
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'plan_id', v_plan_id,
    'plan_name', coalesce(v_plan.name, 'Gratuit'),
    'status', coalesce(v_sub.status, 'expired'),
    'active', v_active,

    -- Les limites restent différentes
    'talent_limit', v_plan.talent_limit,

    -- Les fonctionnalités sont identiques
    'features',
      coalesce(v_plan.features, '[]'::jsonb),

    -- Tous les plans actifs peuvent gérer les projets
    'can_manage_projects',
      v_active,

    -- Le badge Business n'est plus une fonctionnalité bloquante.
    -- On garde le champ pour compatibilité avec l'application.
    'business_badge',
      false
  );

END;
$$;


REVOKE ALL
ON FUNCTION public.get_my_manager_plan_access()
FROM public, anon;

GRANT EXECUTE
ON FUNCTION public.get_my_manager_plan_access()
TO authenticated;


-- ============================================================
-- 3. Gestion des projets disponible pour FREE, PRO et BUSINESS
-- ============================================================

CREATE OR REPLACE FUNCTION public.manager_update_project_status_v2(
  p_project_id uuid,
  p_status text
)
RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_access jsonb;
  v_project public.projects%rowtype;
BEGIN

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Connexion requise'
      USING errcode = '42501';
  END IF;

  IF public.get_my_role() <> 'manager' THEN
    RAISE EXCEPTION 'Compte manager requis'
      USING errcode = '42501';
  END IF;

  IF p_project_id IS NULL THEN
    RAISE EXCEPTION 'Projet manquant';
  END IF;

  IF p_status NOT IN (
    'active',
    'completed',
    'cancelled'
  ) THEN
    RAISE EXCEPTION 'Statut de projet invalide';
  END IF;

  v_access :=
    public.get_my_manager_plan_access();

  -- La seule condition est maintenant :
  -- avoir un abonnement/trial actif.
  IF coalesce(
    (v_access ->> 'active')::boolean,
    false
  ) = false THEN

    RAISE EXCEPTION
      'Votre abonnement est expiré. Choisissez un abonnement pour continuer.';

  END IF;

  SELECT *
  INTO v_project
  FROM public.projects
  WHERE id = p_project_id
    AND manager_id = v_user
  FOR UPDATE;

  IF v_project.id IS NULL THEN
    RAISE EXCEPTION
      'Projet introuvable ou inaccessible';
  END IF;

  UPDATE public.projects
  SET
    status = p_status,
    updated_at = now()
  WHERE id = p_project_id
    AND manager_id = v_user
  RETURNING *
  INTO v_project;

  RETURN v_project;

END;
$$;


REVOKE ALL
ON FUNCTION public.manager_update_project_status_v2(uuid, text)
FROM public, anon;

GRANT EXECUTE
ON FUNCTION public.manager_update_project_status_v2(uuid, text)
TO authenticated;


-- ============================================================
-- 4. Vérification finale des plans
-- ============================================================

SELECT
  id,
  name,
  price,
  currency,
  talent_limit,
  trial_days,
  is_active,
  features
FROM public.plans
WHERE id IN ('FREE', 'PRO', 'BUSINESS')
ORDER BY
  CASE id
    WHEN 'FREE' THEN 1
    WHEN 'PRO' THEN 2
    WHEN 'BUSINESS' THEN 3
  END;


COMMIT;