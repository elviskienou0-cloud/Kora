-- KORA - Avis publics persistants pour ReviewSection.jsx
-- À exécuter dans Supabase SQL Editor après les migrations existantes.

alter table public.reviews
  add column if not exists author_name text,
  add column if not exists role text,
  add column if not exists rating integer,
  add column if not exists comment text,
  add column if not exists source text default 'legacy',
  add column if not exists is_visible boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.reviews drop constraint if exists reviews_rating_valid;
alter table public.reviews
  add constraint reviews_rating_valid check (rating between 1 and 5);

-- Le composant public doit pouvoir lire les avis soumis via ce formulaire.
drop policy if exists reviews_public_testimonial_read on public.reviews;
create policy reviews_public_testimonial_read
on public.reviews
for select
to anon, authenticated
using (
  is_visible = true
  and source = 'public_review'
);

-- Fonction RPC : pas d'INSERT direct depuis le navigateur.
-- Cela permet de conserver les règles de validation côté base.
drop function if exists public.create_public_review(text, integer, text);

create or replace function public.create_public_review(
  p_author_name text,
  p_rating integer,
  p_comment text
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.reviews%rowtype;
  v_user uuid := auth.uid();
  v_name text := btrim(coalesce(p_author_name, ''));
  v_comment text := btrim(coalesce(p_comment, ''));
begin
  if v_user is null then
    raise exception 'Connexion requise pour publier un avis.';
  end if;

  if char_length(v_name) < 2 then
    raise exception 'Le nom doit contenir au moins 2 caractères.';
  end if;

  if char_length(v_name) > 100 then
    raise exception 'Le nom ne doit pas dépasser 100 caractères.';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'La note doit être comprise entre 1 et 5.';
  end if;

  if char_length(v_comment) < 3 then
    raise exception 'Le commentaire est obligatoire.';
  end if;

  if char_length(v_comment) > 3000 then
    raise exception 'Le commentaire ne doit pas dépasser 3000 caractères.';
  end if;

  -- Anti-duplication basique : empêche le même nom/commentaire de
  -- créer plusieurs avis publics dans un court délai.
  if exists (
    select 1
    from public.reviews r
    where r.source = 'public_review'
      and lower(btrim(coalesce(r.author_name, ''))) = lower(v_name)
      and md5(btrim(coalesce(r.comment, ''))) = md5(v_comment)
      and r.created_at > now() - interval '24 hours'
  ) then
    raise exception 'Cet avis a déjà été enregistré récemment.';
  end if;

  insert into public.reviews (
    reviewer_id,
    client_id,
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
    v_user,
    v_user,
    v_name,
    'Client KORA',
    p_rating,
    v_comment,
    'public_review',
    true,
    now(),
    now()
  )
  returning * into v_review;

  return v_review;
end;
$$;

revoke all on function public.create_public_review(text, integer, text) from public;
grant execute on function public.create_public_review(text, integer, text) to authenticated;

-- Realtime est déjà utilisé par ReviewSection.jsx pour actualiser les avis
-- lorsqu'un nouvel avis est ajouté.
alter table public.reviews replica identity full;
