-- KORA — avis directs sur un profil talent
-- À exécuter dans Supabase SQL Editor.

begin;

drop function if exists public.create_talent_review(uuid, integer, text);

create or replace function public.create_talent_review(
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
  v_reviewer_id uuid := auth.uid();
  v_review public.reviews%rowtype;
  v_author_name text;
  v_role text;
begin
  if v_reviewer_id is null then
    raise exception 'Connexion requise';
  end if;

  if p_talent_id is null then
    raise exception 'Talent obligatoire';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'La note doit être comprise entre 1 et 5';
  end if;

  if nullif(trim(coalesce(p_comment, '')), '') is null then
    raise exception 'Le commentaire est obligatoire';
  end if;

  if length(trim(p_comment)) > 3000 then
    raise exception 'Le commentaire ne doit pas dépasser 3000 caractères';
  end if;

  select name, role
    into v_author_name, v_role
  from public.profiles
  where id = v_reviewer_id;

  if coalesce(v_role, '') <> 'client' then
    raise exception 'Seuls les comptes Client peuvent publier un avis sur un talent';
  end if;

  if not exists (
    select 1
    from public.talent_profiles tp
    where tp.id = p_talent_id
      and tp.status = 'published'
      and tp.is_visible = true
  ) then
    raise exception 'Ce talent n''est pas disponible publiquement';
  end if;

  if exists (
    select 1
    from public.reviews r
    where r.reviewer_id = v_reviewer_id
      and r.talent_id = p_talent_id
      and r.source = 'talent_review'
  ) then
    raise exception 'Vous avez déjà laissé un avis sur ce talent';
  end if;

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
    v_reviewer_id,
    v_reviewer_id,
    p_talent_id,
    null,
    coalesce(nullif(trim(v_author_name), ''), 'Client KORA'),
    'Client',
    p_rating,
    trim(p_comment),
    'talent_review',
    true,
    now(),
    now()
  )
  returning * into v_review;

  update public.talent_profiles tp
  set
    rating = coalesce((
      select round(avg(r.rating)::numeric, 2)
      from public.reviews r
      where r.talent_id = tp.id
        and r.source in ('project_review', 'talent_review')
        and r.is_visible = true
    ), 0),
    reviews_count = coalesce((
      select count(*)
      from public.reviews r
      where r.talent_id = tp.id
        and r.source in ('project_review', 'talent_review')
        and r.is_visible = true
    ), 0),
    updated_at = now()
  where tp.id = p_talent_id;

  return v_review;
end;
$$;

revoke all on function public.create_talent_review(uuid, integer, text) from public;
grant execute on function public.create_talent_review(uuid, integer, text) to authenticated;

commit;
