-- KORA — FIX create_project_review / reviewer_id
-- Corrige l'erreur:
-- null value in column "reviewer_id" of relation "reviews"
--
-- À exécuter dans Supabase SQL Editor.
-- La valeur reviewer_id est toujours dérivée de auth.uid()
-- et ne vient jamais du navigateur.

begin;

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

  select name
  into v_client_name
  from public.profiles
  where id = v_client_id;

  insert into public.reviews (
    reviewer_id,
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
  )
  values (
    v_client_id,
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
  returning *
  into v_review;

  update public.talent_profiles tp
  set
    rating = coalesce((
      select round(avg(r.rating)::numeric, 2)
      from public.reviews r
      where r.talent_id = tp.id
        and r.source = 'project_review'
        and r.is_visible = true
    ), 0),
    reviews_count = coalesce((
      select count(*)
      from public.reviews r
      where r.talent_id = tp.id
        and r.source = 'project_review'
        and r.is_visible = true
    ), 0),
    updated_at = now()
  where tp.id = p_talent_id;

  return v_review;
end;
$$;

revoke all on function public.create_project_review(uuid, uuid, integer, text) from public;
grant execute on function public.create_project_review(uuid, uuid, integer, text) to authenticated;

commit;

-- Vérification
select
  column_name,
  is_nullable,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reviews'
  and column_name in ('reviewer_id', 'client_id', 'talent_id', 'project_id')
order by ordinal_position;
