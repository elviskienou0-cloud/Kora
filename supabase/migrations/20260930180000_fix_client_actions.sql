-- KORA — correction des actions Client : Contacter + Laisser un avis
-- Cette migration applique réellement les RPC attendus par le frontend.

begin;

-- ============================================================
-- 1) CONTACTER : créer/récupérer une conversation directe
-- ============================================================

drop function if exists public.create_direct_conversation(uuid);

create or replace function public.create_direct_conversation(
  p_other_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := auth.uid();
  v_conversation_id uuid;
begin
  if v_me is null then
    raise exception 'Connexion requise.';
  end if;

  if p_other_user_id is null then
    raise exception 'Destinataire manquant.';
  end if;

  if v_me = p_other_user_id then
    raise exception 'Vous ne pouvez pas démarrer une conversation avec vous-même.';
  end if;

  select cp1.conversation_id
    into v_conversation_id
  from public.conversation_participants cp1
  join public.conversation_participants cp2
    on cp2.conversation_id = cp1.conversation_id
  where cp1.user_id = v_me
    and cp2.user_id = p_other_user_id
  group by cp1.conversation_id
  having count(*) = 2
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations default values
  returning id into v_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values
    (v_conversation_id, v_me),
    (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

revoke all on function public.create_direct_conversation(uuid) from public, anon;
grant execute on function public.create_direct_conversation(uuid) to authenticated;


-- ============================================================
-- 2) AVIS DIRECT SUR UN TALENT
-- Le frontend appelle create_talent_review().
-- Les avis sont stockés dans public.reviews.
-- ============================================================

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
