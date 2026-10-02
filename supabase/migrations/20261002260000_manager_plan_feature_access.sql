-- KORA — différenciation réelle des offres Manager
-- FREE = découverte / PRO = travail / BUSINESS = développement.
-- Cette migration n'ajoute aucun faux avantage : elle formalise uniquement
-- des capacités réellement présentes dans l'application.

begin;

-- 1) Descriptions fonctionnelles persistées dans les plans.
update public.plans
set features = jsonb_build_array(
  '1 talent maximum',
  'Profil talent',
  'Portfolio et médias',
  'Gestion du cachet',
  'Gestion des demandes',
  'Messagerie',
  'Notifications',
  'Gestion de base des talents'
),
updated_at = now()
where id = 'FREE';

update public.plans
set features = jsonb_build_array(
  '3 talents maximum',
  'Toutes les fonctions du plan Gratuit',
  'Gestion opérationnelle des projets',
  'Gestion avancée des demandes',
  'Gestion professionnelle du profil manager'
),
updated_at = now()
where id = 'PRO';

update public.plans
set features = jsonb_build_array(
  'Talents illimités',
  'Toutes les fonctions du plan Pro',
  'Badge Business sur le profil manager',
  'Organisation sans limite du portefeuille de talents'
),
updated_at = now()
where id = 'BUSINESS';

-- 2) Source serveur de vérité pour savoir ce que le manager peut utiliser.
create or replace function public.get_my_manager_plan_access()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_plan_id text;
  v_active boolean := false;
begin
  if v_user is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;

  if public.get_my_role() <> 'manager' then
    raise exception 'Compte manager requis' using errcode = '42501';
  end if;

  v_sub := public.ensure_my_manager_subscription();
  v_plan_id := upper(coalesce(v_sub.plan_id, v_sub.plan, 'FREE'));

  v_active :=
    v_sub.status in ('trialing', 'active')
    and (v_sub.current_period_end is null or v_sub.current_period_end > now());

  select * into v_plan
  from public.plans
  where id = v_plan_id
    and is_active = true
  limit 1;

  if v_plan.id is null then
    v_plan_id := 'FREE';
    select * into v_plan from public.plans where id = 'FREE' and is_active = true limit 1;
  end if;

  return jsonb_build_object(
    'plan_id', v_plan_id,
    'plan_name', coalesce(v_plan.name, 'Gratuit'),
    'status', coalesce(v_sub.status, 'expired'),
    'active', v_active,
    'talent_limit', v_plan.talent_limit,
    'features', coalesce(v_plan.features, '[]'::jsonb),
    'can_manage_projects', v_active and v_plan_id in ('PRO', 'BUSINESS'),
    'business_badge', v_active and v_plan_id = 'BUSINESS'
  );
end;
$$;

revoke all on function public.get_my_manager_plan_access() from public, anon;
grant execute on function public.get_my_manager_plan_access() to authenticated;

-- 3) RPC dédiée pour la gestion des projets.
-- FREE peut consulter les projets liés aux demandes, mais la modification
-- opérationnelle du statut est réservée à PRO et BUSINESS.
create or replace function public.manager_update_project_status_v2(
  p_project_id uuid,
  p_status text
)
returns public.projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_access jsonb;
  v_project public.projects%rowtype;
begin
  if v_user is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;

  if public.get_my_role() <> 'manager' then
    raise exception 'Compte manager requis' using errcode = '42501';
  end if;

  if p_project_id is null then
    raise exception 'Projet manquant';
  end if;

  if p_status not in ('active', 'completed', 'cancelled') then
    raise exception 'Statut de projet invalide';
  end if;

  v_access := public.get_my_manager_plan_access();

  if coalesce((v_access ->> 'can_manage_projects')::boolean, false) = false then
    raise exception 'La gestion des projets est disponible à partir du plan Pro. Passez à Pro ou Business pour continuer.';
  end if;

  select *
  into v_project
  from public.projects
  where id = p_project_id
    and manager_id = v_user
  for update;

  if v_project.id is null then
    raise exception 'Projet introuvable ou inaccessible';
  end if;

  update public.projects
  set status = p_status,
      updated_at = now()
  where id = p_project_id
    and manager_id = v_user
  returning * into v_project;

  return v_project;
end;
$$;

revoke all on function public.manager_update_project_status_v2(uuid,text) from public, anon;
grant execute on function public.manager_update_project_status_v2(uuid,text) to authenticated;

commit;
