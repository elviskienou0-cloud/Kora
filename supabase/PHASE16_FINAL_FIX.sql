-- ============================================================
-- KORA — PHASE 16 / CORRECTIONS MÉTIER + ADMIN
--
-- Objectifs :
-- 1) Demande de collaboration = contexte complet du projet.
-- 2) Une demande sans projet préalable peut créer automatiquement
--    un projet Supabase en statut pending.
-- 3) Manager : accepter/refuser + gérer le projet + le terminer.
-- 4) Client : peut ensuite laisser une note/avis sur un projet terminé.
-- 5) Admin : validation sécurisée des paiements.
-- 6) Profils : colonnes d'informations complémentaires si absentes.
--
-- Cette migration est ADDITIVE : aucun DROP de table n'est effectué.
-- Les anciennes colonnes reviews sont conservées pour compatibilité.
-- ============================================================

begin;

-- ============================================================
-- 1) PROFILES : infos administrables
-- ============================================================
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;

create index if not exists profiles_city_idx on public.profiles(city);
create index if not exists profiles_company_idx on public.profiles(company);

-- ============================================================
-- 2) REQUESTS : contexte professionnel complet
-- ============================================================
alter table public.requests add column if not exists project_type text;
alter table public.requests add column if not exists project_date_start date;
alter table public.requests add column if not exists project_date_end date;
alter table public.requests add column if not exists location text;
alter table public.requests add column if not exists additional_info text;

alter table public.requests drop constraint if exists requests_project_dates_valid;
alter table public.requests
  add constraint requests_project_dates_valid
  check (
    project_date_start is null
    or project_date_end is null
    or project_date_end >= project_date_start
  );

create index if not exists requests_manager_created_idx
  on public.requests(manager_id, created_at desc);
create index if not exists requests_project_created_idx
  on public.requests(project_id, created_at desc);
create index if not exists requests_talent_status_idx
  on public.requests(talent_id, status);

-- ============================================================
-- 3) CRÉATION D'UNE DEMANDE À PARTIR D'UN TALENT
--    project_id est optionnel.
--    Sans project_id -> création automatique du projet.
-- ============================================================
drop function if exists public.create_request_from_talent_v2(
  uuid, uuid, text, text, text, date, date, numeric, text, text, text
);

create or replace function public.create_request_from_talent_v2(
  p_talent_id uuid,
  p_project_id uuid default null,
  p_title text default null,
  p_project_type text default null,
  p_description text default null,
  p_project_date_start date default null,
  p_project_date_end date default null,
  p_budget numeric default null,
  p_currency text default 'XOF',
  p_location text default null,
  p_additional_info text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_client_id uuid := auth.uid();
  v_manager_id uuid;
  v_talent public.talent_profiles%rowtype;
  v_project public.projects%rowtype;
  v_project_id uuid := p_project_id;
  v_request_id uuid;
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_currency text := coalesce(nullif(trim(coalesce(p_currency, '')), ''), 'XOF');
begin
  if v_client_id is null then
    raise exception 'Utilisateur non authentifié';
  end if;

  if public.get_my_role() <> 'client' and not public.is_admin() then
    raise exception 'Seul un client peut envoyer une demande';
  end if;

  if p_talent_id is null then
    raise exception 'Talent manquant';
  end if;

  if v_title is null then
    raise exception 'Le titre du projet est obligatoire';
  end if;

  if nullif(trim(coalesce(p_description, '')), '') is null then
    raise exception 'La description du projet est obligatoire';
  end if;

  if p_budget is not null and p_budget < 0 then
    raise exception 'Le budget est invalide';
  end if;

  if p_project_date_start is not null
     and p_project_date_end is not null
     and p_project_date_end < p_project_date_start then
    raise exception 'La fin de période ne peut pas être avant le début';
  end if;

  select *
  into v_talent
  from public.talent_profiles
  where id = p_talent_id
    and status = 'published'
    and coalesce(is_visible, true) = true;

  if v_talent.id is null then
    raise exception 'Talent introuvable ou non disponible';
  end if;

  v_manager_id := v_talent.managed_by;

  if v_manager_id is null then
    raise exception 'Ce talent n''a aucun manager assigné';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_manager_id and role = 'manager'
  ) then
    raise exception 'Le manager du talent est invalide';
  end if;

  if v_project_id is not null then
    select *
    into v_project
    from public.projects
    where id = v_project_id
      and client_id = v_client_id
    for update;

    if v_project.id is null then
      raise exception 'Projet introuvable ou inaccessible';
    end if;

    if v_project.status in ('completed', 'cancelled') then
      raise exception 'Ce projet ne peut plus recevoir de demande';
    end if;
  else
    insert into public.projects (
      client_id,
      manager_id,
      title,
      description,
      budget_min,
      budget_max,
      currency,
      status,
      due_date
    )
    values (
      v_client_id,
      null,
      v_title,
      nullif(trim(coalesce(p_description, '')), ''),
      p_budget,
      p_budget,
      v_currency,
      'pending',
      coalesce(p_project_date_end, p_project_date_start)
    )
    returning * into v_project;

    v_project_id := v_project.id;
  end if;

  -- Empêcher une double demande active pour la même collaboration.
  if exists (
    select 1
    from public.requests r
    where r.client_id = v_client_id
      and r.talent_id = p_talent_id
      and r.manager_id = v_manager_id
      and lower(coalesce(r.status, 'pending')) in ('pending', 'open')
      and (
        r.project_id = v_project_id
        or (
          r.title = v_title
          and coalesce(r.project_date_start, p_project_date_start) is not distinct from p_project_date_start
          and coalesce(r.project_date_end, p_project_date_end) is not distinct from p_project_date_end
        )
      )
  ) then
    raise exception 'Une demande similaire est déjà en attente pour ce talent';
  end if;

  insert into public.requests (
    client_id,
    manager_id,
    talent_id,
    project_id,
    title,
    project_type,
    description,
    project_date_start,
    project_date_end,
    budget,
    currency,
    location,
    additional_info,
    status
  )
  values (
    v_client_id,
    v_manager_id,
    p_talent_id,
    v_project_id,
    v_title,
    nullif(trim(coalesce(p_project_type, '')), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    p_project_date_start,
    p_project_date_end,
    p_budget,
    v_currency,
    nullif(trim(coalesce(p_location, '')), ''),
    nullif(trim(coalesce(p_additional_info, '')), ''),
    'pending'
  )
  returning id into v_request_id;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    is_read,
    created_at
  )
  values (
    v_manager_id,
    'request',
    'Nouvelle demande de collaboration',
    concat(
      'Le client vous a envoyé une demande pour « ',
      v_title,
      ' » concernant le talent ',
      trim(concat(coalesce(v_talent.first_name, ''), ' ', coalesce(v_talent.last_name, ''))),
      '.'
    ),
    jsonb_build_object(
      'request_id', v_request_id,
      'project_id', v_project_id,
      'talent_id', p_talent_id,
      'client_id', v_client_id
    ),
    false,
    now()
  );

  return v_request_id;
end;
$$;

revoke all on function public.create_request_from_talent_v2(uuid, uuid, text, text, text, date, date, numeric, text, text, text) from public;
grant execute on function public.create_request_from_talent_v2(uuid, uuid, text, text, text, date, date, numeric, text, text, text) to authenticated;

-- Compatibilité avec l'ancien frontend : ancien RPC conservé mais délégué au nouveau.
drop function if exists public.create_request_from_talent(uuid, uuid, text, text, numeric, text);

create or replace function public.create_request_from_talent(
  p_talent_id uuid,
  p_project_id uuid,
  p_title text,
  p_description text,
  p_budget numeric,
  p_currency text
)
returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.create_request_from_talent_v2(
    p_talent_id,
    p_project_id,
    p_title,
    null,
    p_description,
    null,
    null,
    p_budget,
    p_currency,
    null,
    null
  );
$$;

revoke all on function public.create_request_from_talent(uuid, uuid, text, text, numeric, text) from public;
grant execute on function public.create_request_from_talent(uuid, uuid, text, text, numeric, text) to authenticated;

-- ============================================================
-- 4) MANAGER : gestion du projet issu d'une demande acceptée
-- ============================================================
drop function if exists public.manager_update_project_status(uuid, text);

create or replace function public.manager_update_project_status(
  p_project_id uuid,
  p_status text
)
returns public.projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_manager_id uuid := auth.uid();
  v_project public.projects%rowtype;
begin
  if v_manager_id is null then
    raise exception 'Utilisateur non authentifié';
  end if;

  if public.get_my_role() <> 'manager' and not public.is_admin() then
    raise exception 'Accès manager requis';
  end if;

  if p_project_id is null then
    raise exception 'Projet manquant';
  end if;

  if p_status not in ('active', 'completed', 'cancelled') then
    raise exception 'Statut de projet invalide';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
    and manager_id = v_manager_id
  for update;

  if v_project.id is null then
    raise exception 'Projet introuvable ou non assigné à ce manager';
  end if;

  if not exists (
    select 1 from public.requests r
    where r.project_id = p_project_id
      and r.manager_id = v_manager_id
      and r.status = 'accepted'
  ) then
    raise exception 'Le projet doit provenir d''une demande acceptée';
  end if;

  if v_project.status = 'completed' and p_status <> 'completed' then
    raise exception 'Un projet terminé ne peut pas être réactivé';
  end if;

  if v_project.status = 'cancelled' and p_status <> 'cancelled' then
    raise exception 'Un projet annulé ne peut pas être réactivé';
  end if;

  update public.projects
  set status = p_status, updated_at = now()
  where id = p_project_id
  returning * into v_project;

  if p_status = 'completed' then
    insert into public.notifications (user_id, type, title, message, data, is_read, created_at)
    values (
      v_project.client_id,
      'request',
      'Projet terminé',
      concat('Le projet « ', v_project.title, ' » a été marqué comme terminé.'),
      jsonb_build_object('project_id', v_project.id),
      false,
      now()
    );
  end if;

  return v_project;
end;
$$;

revoke all on function public.manager_update_project_status(uuid, text) from public;
grant execute on function public.manager_update_project_status(uuid, text) to authenticated;

-- ============================================================
-- 5) ADMIN : modifier un profil utilisateur
--     Le rôle est modifié sous contrôle de auth.uid()/is_admin()
--     afin de rester compatible avec le trigger anti-escalade.
-- ============================================================
drop function if exists public.admin_update_user(uuid, jsonb);

create or replace function public.admin_update_user(
  p_user_id uuid,
  p_patch jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_requested_role text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Utilisateur introuvable';
  end if;

  v_requested_role := nullif(trim(coalesce(p_patch ->> 'role', '')), '');

  if v_requested_role is not null and v_requested_role not in ('client', 'manager', 'admin') then
    raise exception 'Rôle invalide';
  end if;

  if p_user_id = auth.uid() and v_requested_role is not null then
    raise exception 'Un administrateur ne peut pas modifier son propre rôle';
  end if;

  update public.profiles
  set
    name = case when p_patch ? 'name' then nullif(trim(coalesce(p_patch ->> 'name', '')), '') else name end,
    avatar = case when p_patch ? 'avatar' then nullif(trim(coalesce(p_patch ->> 'avatar', '')), '') else avatar end,
    role = case when p_patch ? 'role' then p_patch ->> 'role' else role end,
    phone = case when p_patch ? 'phone' then nullif(trim(coalesce(p_patch ->> 'phone', '')), '') else phone end,
    city = case when p_patch ? 'city' then nullif(trim(coalesce(p_patch ->> 'city', '')), '') else city end,
    company = case when p_patch ? 'company' then nullif(trim(coalesce(p_patch ->> 'company', '')), '') else company end,
    bio = case when p_patch ? 'bio' then nullif(trim(coalesce(p_patch ->> 'bio', '')), '') else bio end,
    preferences = case when p_patch ? 'preferences' then coalesce(p_patch -> 'preferences', '{}'::jsonb) else preferences end,
    updated_at = now()
  where id = p_user_id
  returning * into v_profile;

  perform public.write_admin_audit_log(
    'user.update',
    'profile',
    v_profile.id,
    v_profile.id,
    jsonb_build_object('fields', (select jsonb_agg(key) from jsonb_object_keys(p_patch) as key))
  );

  return v_profile;
end;
$$;

revoke all on function public.admin_update_user(uuid, jsonb) from public;
grant execute on function public.admin_update_user(uuid, jsonb) to authenticated;

-- ============================================================
-- 6) ADMIN : validation sécurisée d'un paiement
-- ============================================================
drop function if exists public.admin_validate_payment(uuid, text, text);

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
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  if p_payment_id is null then
    raise exception 'Paiement manquant';
  end if;

  if p_status not in ('paid', 'failed', 'cancelled', 'refunded') then
    raise exception 'Statut de paiement invalide';
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if v_payment.id is null then
    raise exception 'Paiement introuvable';
  end if;

  v_old_status := v_payment.status;

  update public.payments
  set
    status = p_status,
    paid_at = case
      when p_status = 'paid' then coalesce(paid_at, now())
      else paid_at
    end,
    metadata =
      coalesce(metadata, '{}'::jsonb)
      || case when p_note is null then '{}'::jsonb else jsonb_build_object('admin_note', p_note) end,
    updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  if p_status = 'paid' and v_payment.subscription_id is not null then
    if lower(coalesce(v_payment.billing_cycle, 'monthly')) = 'yearly' then
      v_end := v_start + interval '12 months';
    else
      v_end := v_start + interval '1 month';
    end if;

    update public.subscriptions
    set
      status = 'active',
      current_period_start = v_start,
      current_period_end = v_end,
      updated_at = now()
    where id = v_payment.subscription_id;
  end if;

  if v_old_status is distinct from p_status then
    insert into public.notifications (user_id, type, title, message, data, is_read, created_at)
    values (
      v_payment.user_id,
      'payment',
      'Mise à jour du paiement',
      concat('Votre paiement ', coalesce(v_payment.reference, v_payment.id::text), ' est maintenant : ', p_status, '.'),
      jsonb_build_object('payment_id', v_payment.id, 'status', p_status),
      false,
      now()
    );
  end if;

  perform public.write_admin_audit_log(
    'payment.status_update',
    'payment',
    v_payment.id,
    v_payment.user_id,
    jsonb_build_object(
      'from', v_old_status,
      'to', p_status,
      'note', p_note
    )
  );

  return v_payment;
end;
$$;

revoke all on function public.admin_validate_payment(uuid, text, text) from public;
grant execute on function public.admin_validate_payment(uuid, text, text) to authenticated;

-- ============================================================
-- 7) REVIEWS : permettre au client d'évaluer un projet terminé
-- ============================================================

alter table public.reviews add column if not exists client_id uuid;
alter table public.reviews add column if not exists talent_id uuid;
alter table public.reviews add column if not exists project_id uuid;
alter table public.reviews add column if not exists author_name text;
alter table public.reviews add column if not exists role text;
alter table public.reviews add column if not exists rating integer;
alter table public.reviews add column if not exists comment text;
alter table public.reviews add column if not exists source text default 'legacy';
alter table public.reviews add column if not exists is_visible boolean default true;
alter table public.reviews add column if not exists created_at timestamptz default now();
alter table public.reviews add column if not exists updated_at timestamptz default now();

alter table public.reviews drop constraint if exists reviews_rating_valid;
alter table public.reviews add constraint reviews_rating_valid check (rating between 1 and 5);

create index if not exists reviews_project_client_idx on public.reviews(project_id, client_id);
create index if not exists reviews_talent_created_idx on public.reviews(talent_id, created_at desc);

create unique index if not exists reviews_one_project_talent_client_idx
on public.reviews(client_id, talent_id, project_id)
where source = 'project_review'
  and client_id is not null
  and talent_id is not null
  and project_id is not null;

-- Nettoyer puis recréer les policies reviews pour que le client puisse lire
-- ses propres avis et que le public lise uniquement les avis publiés.
do $$
declare p record;
begin
  if to_regclass('public.reviews') is null then return; end if;
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'reviews'
  loop
    execute format('drop policy if exists %I on public.reviews', p.policyname);
  end loop;
end
$$;

alter table public.reviews enable row level security;

create policy reviews_public_read
on public.reviews
for select
to anon, authenticated
using (
  is_visible = true
  and source = 'project_review'
  and client_id is not null
  and talent_id is not null
  and project_id is not null
);

create policy reviews_client_own_read
on public.reviews
for select
to authenticated
using (client_id = auth.uid() or public.is_admin());

create policy reviews_admin_write
on public.reviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Création d'un avis : uniquement par le client propriétaire d'un projet
-- terminé et pour un talent réellement engagé par une demande acceptée.
drop function if exists public.create_project_review(uuid, uuid, integer, text);

create or replace function public.create_project_review(
  p_project_id uuid,
  p_talent_id uuid,
  p_rating integer,
  p_comment text
)
returns public.reviews
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_client_id uuid := auth.uid();
  v_review public.reviews%rowtype;
  v_client_name text;
begin
  if v_client_id is null then
    raise exception 'Connexion requise';
  end if;

  if p_project_id is null or p_talent_id is null then
    raise exception 'Projet et talent obligatoires';
  end if;

  if p_rating not between 1 and 5 then
    raise exception 'La note doit être comprise entre 1 et 5';
  end if;

  if nullif(trim(coalesce(p_comment, '')), '') is null then
    raise exception 'Le commentaire est obligatoire';
  end if;

  if length(trim(p_comment)) > 3000 then
    raise exception 'Le commentaire est trop long';
  end if;

  if not exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.client_id = v_client_id
      and p.status = 'completed'
  ) then
    raise exception 'Ce projet n''est pas terminé ou ne vous appartient pas';
  end if;

  if not exists (
    select 1
    from public.requests r
    where r.project_id = p_project_id
      and r.client_id = v_client_id
      and r.talent_id = p_talent_id
      and r.status = 'accepted'
  ) then
    raise exception 'Ce talent n''est pas rattaché à ce projet';
  end if;

  if exists (
    select 1
    from public.reviews r
    where r.client_id = v_client_id
      and r.talent_id = p_talent_id
      and r.project_id = p_project_id
      and r.source = 'project_review'
  ) then
    raise exception 'Vous avez déjà évalué ce talent pour ce projet';
  end if;

  select name into v_client_name
  from public.profiles
  where id = v_client_id;

  insert into public.reviews (
    client_id,
    talent_id,
    project_id,
    author_name,
    role,
    rating,
    comment,
    source,
    is_visible,
    created_at,
    updated_at
  ) values (
    v_client_id,
    p_talent_id,
    p_project_id,
    coalesce(v_client_name, 'Client KORA'),
    'Client',
    p_rating,
    trim(p_comment),
    'project_review',
    true,
    now(),
    now()
  )
  returning * into v_review;

  update public.talent_profiles tp
  set
    rating = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.talent_id = tp.id and r.source = 'project_review' and r.is_visible = true), 0),
    reviews_count = coalesce((select count(*) from public.reviews r where r.talent_id = tp.id and r.source = 'project_review' and r.is_visible = true), 0),
    updated_at = now()
  where tp.id = p_talent_id;

  return v_review;
end;
$$;

revoke all on function public.create_project_review(uuid, uuid, integer, text) from public;
grant execute on function public.create_project_review(uuid, uuid, integer, text) to authenticated;

commit;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
select table_name, column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name in ('profiles','requests','reviews')
  and column_name in ('phone','city','company','bio','preferences','project_type','project_date_start','project_date_end','location','additional_info','client_id','talent_id','project_id','rating','comment','source','is_visible')
order by table_name, ordinal_position;

select routine_name, pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and routine_name in ('create_request_from_talent_v2','manager_update_project_status','admin_update_user','admin_validate_payment','create_project_review')
order by routine_name;
