-- Fix direct conversations for both manager -> client and client -> manager flows.
-- The conversation must include the manager who owns the selected talent.

CREATE OR REPLACE FUNCTION public.create_direct_conversation(p_other_user_id uuid, p_talent_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_me uuid := auth.uid();
  v_conversation_id uuid;
  v_talent_name text;
  v_manager_id uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Connexion requise.';
  END IF;

  IF p_other_user_id IS NULL THEN
    RAISE EXCEPTION 'Destinataire manquant.';
  END IF;

  IF p_talent_id IS NULL THEN
    RAISE EXCEPTION 'Talent manquant.';
  END IF;

  IF v_me = p_other_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas démarrer une conversation avec vous-même.';
  END IF;

  SELECT
    NULLIF(TRIM(CONCAT_WS(' ', tp.first_name, tp.last_name)), ''),
    tp.managed_by
  INTO v_talent_name, v_manager_id
  FROM public.talent_profiles tp
  WHERE tp.id = p_talent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Talent introuvable.';
  END IF;

  IF v_manager_id IS NULL THEN
    RAISE EXCEPTION 'Ce talent n''a pas de manager valide.';
  END IF;

  IF v_me <> v_manager_id AND p_other_user_id <> v_manager_id THEN
    RAISE EXCEPTION 'La conversation doit inclure le manager du talent.';
  END IF;

  SELECT c.id
  INTO v_conversation_id
  FROM public.conversations c
  JOIN public.conversation_participants cp_me
    ON cp_me.conversation_id = c.id
   AND cp_me.user_id = v_me
  JOIN public.conversation_participants cp_other
    ON cp_other.conversation_id = c.id
   AND cp_other.user_id = p_other_user_id
  WHERE c.talent_id = p_talent_id
    AND (
      SELECT COUNT(*)
      FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id
    ) = 2
  ORDER BY c.created_at ASC
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  IF v_talent_name IS NOT NULL THEN
    SELECT c.id
    INTO v_conversation_id
    FROM public.conversations c
    JOIN public.conversation_participants cp_me
      ON cp_me.conversation_id = c.id
     AND cp_me.user_id = v_me
    JOIN public.conversation_participants cp_other
      ON cp_other.conversation_id = c.id
     AND cp_other.user_id = p_other_user_id
    WHERE c.talent_id IS NULL
      AND LOWER(TRIM(COALESCE(c.title, ''))) = LOWER(TRIM(v_talent_name))
      AND (
        SELECT COUNT(*)
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = c.id
      ) = 2
    ORDER BY c.created_at ASC
    LIMIT 1;

    IF v_conversation_id IS NOT NULL THEN
      UPDATE public.conversations
      SET
        talent_id = p_talent_id,
        title = LEFT(v_talent_name, 200),
        updated_at = NOW()
      WHERE id = v_conversation_id;

      RETURN v_conversation_id;
    END IF;
  END IF;

  INSERT INTO public.conversations (talent_id, title)
  VALUES (
    p_talent_id,
    LEFT(COALESCE(v_talent_name, 'Conversation'), 200)
  )
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES
    (v_conversation_id, v_me),
    (v_conversation_id, p_other_user_id);

  RETURN v_conversation_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_direct_conversation(uuid, uuid)
TO authenticated;

NOTIFY pgrst, 'reload schema';
