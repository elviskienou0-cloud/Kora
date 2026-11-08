-- Require an accepted request on a completed project before a client can
-- publish a talent review. This prevents unverifiable reputation manipulation.
CREATE OR REPLACE FUNCTION public.create_talent_review(
  p_talent_id uuid,
  p_rating integer,
  p_comment text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_review_id uuid;
  v_client_name text;
  v_project_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Connexion requise.'; END IF;
  IF p_talent_id IS NULL THEN RAISE EXCEPTION 'Talent manquant.'; END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'La note doit être comprise entre 1 et 5.';
  END IF;
  IF nullif(trim(coalesce(p_comment, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Le commentaire est obligatoire.';
  END IF;
  IF length(trim(p_comment)) > 3000 THEN
    RAISE EXCEPTION 'Le commentaire ne doit pas dépasser 3000 caractères.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'client') THEN
    RAISE EXCEPTION 'Seuls les clients peuvent publier un avis.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.talent_profiles
    WHERE id = p_talent_id AND status = 'published' AND is_visible = true
  ) THEN
    RAISE EXCEPTION 'Ce talent n''est pas disponible publiquement.';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_talent_id::text, 0)
  );

  SELECT r.project_id INTO v_project_id
  FROM public.requests r
  JOIN public.projects p ON p.id = r.project_id
  WHERE r.client_id = v_user_id
    AND r.talent_id = p_talent_id
    AND r.status = 'accepted'
    AND p.status = 'completed'
  ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
  LIMIT 1;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Vous pourrez publier un avis après avoir terminé un projet avec ce talent.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.client_id = v_user_id
      AND r.talent_id = p_talent_id
      AND r.source IN ('talent_review', 'project_review')
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà publié un avis pour ce talent.';
  END IF;

  SELECT coalesce(name, 'Client') INTO v_client_name
  FROM public.profiles WHERE id = v_user_id;

  INSERT INTO public.reviews (
    reviewer_id, client_id, talent_id, project_id, author_name, role,
    rating, comment, source, is_visible, created_at, updated_at
  )
  VALUES (
    v_user_id, v_user_id, p_talent_id, v_project_id, v_client_name, 'Client',
    p_rating, trim(p_comment), 'project_review', true, now(), now()
  )
  RETURNING id INTO v_review_id;

  UPDATE public.talent_profiles
  SET
    rating = coalesce((
      SELECT round(avg(r.rating)::numeric, 2)
      FROM public.reviews r
      WHERE r.talent_id = p_talent_id
        AND r.source IN ('project_review', 'talent_review')
        AND r.is_visible = true
    ), 0),
    reviews_count = (
      SELECT count(*) FROM public.reviews r
      WHERE r.talent_id = p_talent_id
        AND r.source IN ('project_review', 'talent_review')
        AND r.is_visible = true
    ),
    updated_at = now()
  WHERE id = p_talent_id;

  RETURN v_review_id;
END;
$function$;
