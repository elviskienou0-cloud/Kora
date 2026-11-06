-- Harden administrative profile updates and invitation registration.
-- Applied to Supabase project lhqbvswhfudcsrtvqzqj as migration
-- 20261106211214_harden_admin_profile_updates_and_invitation_registration.

CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id uuid,
  p_patch jsonb DEFAULT '{}'::jsonb
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_current_role text;
  v_requested_role text;
  v_actor_suspended boolean;
  v_actor_is_super_admin boolean;
  v_key text;
  v_value jsonb;
BEGIN
  PERFORM public.admin_require_permission('users.manage');

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise'
      USING ERRCODE = '42501';
  END IF;

  SELECT p.is_suspended
    INTO v_actor_suspended
  FROM public.profiles AS p
  WHERE p.id = auth.uid();

  IF NOT FOUND OR COALESCE(v_actor_suspended, false) THEN
    RAISE EXCEPTION 'Compte administrateur suspendu ou introuvable'
      USING ERRCODE = '42501';
  END IF;

  v_actor_is_super_admin := public.is_super_admin();

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur manquant';
  END IF;

  IF p_patch IS NULL OR jsonb_typeof(p_patch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Les modifications doivent être fournies sous forme d’objet JSON';
  END IF;

  IF p_patch = '{}'::jsonb THEN
    RAISE EXCEPTION 'Aucune modification fournie';
  END IF;

  FOR v_key, v_value IN
    SELECT e.key, e.value
    FROM jsonb_each(p_patch) AS e
  LOOP
    IF v_key NOT IN (
      'name', 'avatar', 'role', 'phone',
      'city', 'company', 'bio', 'preferences'
    ) THEN
      RAISE EXCEPTION 'Champ non autorisé : %', v_key;
    END IF;

    IF v_key = 'preferences' THEN
      IF jsonb_typeof(v_value) NOT IN ('object', 'null') THEN
        RAISE EXCEPTION 'Le champ preferences doit être un objet JSON';
      END IF;
    ELSIF jsonb_typeof(v_value) NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'Type invalide pour le champ : %', v_key;
    END IF;
  END LOOP;

  IF p_patch ? 'name'
     AND NULLIF(BTRIM(p_patch->>'name'), '') IS NULL THEN
    RAISE EXCEPTION 'Le nom ne peut pas être vide';
  END IF;

  IF p_patch ? 'role' THEN
    IF jsonb_typeof(p_patch->'role') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'Le rôle doit être une chaîne non vide';
    END IF;

    v_requested_role := LOWER(NULLIF(BTRIM(p_patch->>'role'), ''));

    IF v_requested_role IS NULL THEN
      RAISE EXCEPTION 'Le rôle ne peut pas être vide';
    END IF;

    IF v_requested_role NOT IN ('client', 'manager', 'admin') THEN
      RAISE EXCEPTION 'Rôle invalide ou protégé';
    END IF;

    IF NOT v_actor_is_super_admin THEN
      RAISE EXCEPTION 'Seul le Super Admin peut modifier les rôles'
        USING ERRCODE = '42501';
    END IF;

    IF p_user_id = auth.uid() THEN
      RAISE EXCEPTION 'Vous ne pouvez pas modifier votre propre rôle';
    END IF;
  END IF;

  SELECT p.role
    INTO v_current_role
  FROM public.profiles AS p
  WHERE p.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  IF v_current_role = 'superadmin' AND p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Compte Super Admin protégé : modification interdite'
      USING ERRCODE = '42501';
  END IF;

  IF v_current_role = 'superadmin' AND p_patch ? 'role' THEN
    RAISE EXCEPTION 'Le rôle Super Admin ne peut pas être modifié par cette fonction'
      USING ERRCODE = '42501';
  END IF;

  IF v_current_role = 'admin' AND NOT v_actor_is_super_admin THEN
    RAISE EXCEPTION 'La gestion des comptes administrateurs est réservée au Super Admin'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles AS p
  SET
    name = CASE
      WHEN p_patch ? 'name' THEN BTRIM(p_patch->>'name')
      ELSE p.name
    END,
    avatar = CASE
      WHEN p_patch ? 'avatar' THEN NULLIF(BTRIM(p_patch->>'avatar'), '')
      ELSE p.avatar
    END,
    role = CASE
      WHEN p_patch ? 'role' THEN v_requested_role
      ELSE p.role
    END,
    phone = CASE
      WHEN p_patch ? 'phone' THEN NULLIF(BTRIM(p_patch->>'phone'), '')
      ELSE p.phone
    END,
    city = CASE
      WHEN p_patch ? 'city' THEN NULLIF(BTRIM(p_patch->>'city'), '')
      ELSE p.city
    END,
    company = CASE
      WHEN p_patch ? 'company' THEN NULLIF(BTRIM(p_patch->>'company'), '')
      ELSE p.company
    END,
    bio = CASE
      WHEN p_patch ? 'bio' THEN NULLIF(BTRIM(p_patch->>'bio'), '')
      ELSE p.bio
    END,
    preferences = CASE
      WHEN NOT (p_patch ? 'preferences') THEN p.preferences
      WHEN p_patch->'preferences' = 'null'::jsonb THEN '{}'::jsonb
      ELSE p_patch->'preferences'
    END,
    updated_at = now()
  WHERE p.id = p_user_id
  RETURNING p.* INTO v_profile;

  PERFORM public.write_admin_audit_log_internal(
    'user.update',
    'profile',
    v_profile.id,
    v_profile.id,
    jsonb_build_object(
      'fields',
      (
        SELECT jsonb_agg(k)
        FROM jsonb_object_keys(p_patch) AS keys(k)
      )
    )
  );

  RETURN v_profile;
END;
$function$;


CREATE OR REPLACE FUNCTION public.register_admin_invitation(
  p_invitation_id uuid,
  p_invited_user_id uuid,
  p_email text,
  p_message text,
  p_access_level text DEFAULT 'associate'::text,
  p_permissions jsonb DEFAULT '{}'::jsonb,
  p_max_users integer DEFAULT NULL::integer,
  p_max_payment_validations integer DEFAULT NULL::integer,
  p_access_expires_at timestamptz DEFAULT NULL::timestamptz,
  p_scope jsonb DEFAULT '{}'::jsonb
)
RETURNS public.admin_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_inv public.admin_invitations;
  v_actor_id uuid := auth.uid();
  v_actor_suspended boolean;
  v_target_role text;
  v_auth_email text;
  v_auth_invited_at timestamptz;
  v_permissions jsonb := COALESCE(p_permissions, '{}'::jsonb);
  v_scope jsonb := COALESCE(p_scope, '{}'::jsonb);
  v_key text;
  v_value jsonb;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Accès Super Admin requis'
      USING ERRCODE = '42501';
  END IF;

  SELECT p.is_suspended
    INTO v_actor_suspended
  FROM public.profiles AS p
  WHERE p.id = v_actor_id;

  IF NOT FOUND OR COALESCE(v_actor_suspended, false) THEN
    RAISE EXCEPTION 'Compte Super Admin suspendu ou introuvable'
      USING ERRCODE = '42501';
  END IF;

  IF p_invitation_id IS NULL OR p_invited_user_id IS NULL THEN
    RAISE EXCEPTION 'Identifiants d’invitation et d’utilisateur obligatoires';
  END IF;

  IF p_invited_user_id = v_actor_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous inviter vous-même';
  END IF;

  IF p_access_level IS DISTINCT FROM 'associate' THEN
    RAISE EXCEPTION 'Seul le niveau associate peut être attribué par invitation'
      USING ERRCODE = '42501';
  END IF;

  IF p_email IS NULL OR BTRIM(p_email) = ''
     OR POSITION('@' IN BTRIM(p_email)) <= 1 THEN
    RAISE EXCEPTION 'Adresse email invalide';
  END IF;

  IF jsonb_typeof(v_permissions) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Les permissions doivent être un objet JSON';
  END IF;

  FOR v_key, v_value IN
    SELECT e.key, e.value
    FROM jsonb_each(v_permissions) AS e
  LOOP
    IF v_key NOT IN (
      'users.read',
      'users.manage',
      'clients.read',
      'managers.read',
      'talents.read',
      'talents.manage',
      'requests.read',
      'projects.read',
      'payments.read',
      'payments.validate',
      'subscriptions.read',
      'subscriptions.manage',
      'moderation.read',
      'moderation.manage',
      'messages.read',
      'logs.read',
      'notifications.write',
      'announcements.write',
      'settings.read'
    ) THEN
      RAISE EXCEPTION 'Permission inconnue ou interdite : %', v_key
        USING ERRCODE = '22023';
    END IF;

    IF jsonb_typeof(v_value) IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'La permission % doit avoir une valeur booléenne', v_key
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  IF jsonb_typeof(v_scope) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Le périmètre administratif doit être un objet JSON';
  END IF;

  IF p_max_users IS NOT NULL AND p_max_users < 0 THEN
    RAISE EXCEPTION 'La limite utilisateurs ne peut pas être négative';
  END IF;

  IF p_max_payment_validations IS NOT NULL
     AND p_max_payment_validations < 0 THEN
    RAISE EXCEPTION 'La limite de validations ne peut pas être négative';
  END IF;

  IF p_access_expires_at IS NOT NULL
     AND p_access_expires_at <= now() THEN
    RAISE EXCEPTION 'La date d’expiration doit être dans le futur';
  END IF;

  SELECT LOWER(u.email), u.invited_at
    INTO v_auth_email, v_auth_invited_at
  FROM auth.users AS u
  WHERE u.id = p_invited_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Compte Auth invité introuvable';
  END IF;

  IF v_auth_email IS DISTINCT FROM LOWER(BTRIM(p_email)) THEN
    RAISE EXCEPTION 'L’adresse email ne correspond pas au compte invité';
  END IF;

  IF v_auth_invited_at IS NULL THEN
    RAISE EXCEPTION 'Le compte cible ne provient pas du flux d’invitation Auth';
  END IF;

  SELECT p.role
    INTO v_target_role
  FROM public.profiles AS p
  WHERE p.id = p_invited_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil invité introuvable';
  END IF;

  IF v_target_role IS DISTINCT FROM 'client' THEN
    RAISE EXCEPTION 'Seul un nouveau compte client peut être converti en administrateur';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_access_profiles AS a
    WHERE a.user_id = p_invited_user_id
  ) THEN
    RAISE EXCEPTION 'Un profil d’accès administrateur existe déjà pour cet utilisateur';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admin_invitations AS i
    WHERE i.id = p_invitation_id
  ) THEN
    RAISE EXCEPTION 'Cet identifiant d’invitation existe déjà';
  END IF;

  UPDATE public.profiles AS p
  SET role = 'admin',
      updated_at = now()
  WHERE p.id = p_invited_user_id;

  INSERT INTO public.admin_access_profiles (
    user_id,
    access_level,
    permissions,
    max_users,
    max_payment_validations,
    access_expires_at,
    scope,
    is_active,
    created_by,
    updated_by
  )
  VALUES (
    p_invited_user_id,
    'associate',
    v_permissions,
    p_max_users,
    p_max_payment_validations,
    p_access_expires_at,
    v_scope,
    true,
    v_actor_id,
    v_actor_id
  );

  INSERT INTO public.admin_invitations (
    id,
    email,
    invited_user_id,
    invited_by,
    message,
    access_level,
    permissions,
    max_users,
    max_payment_validations,
    access_expires_at,
    scope,
    status
  )
  VALUES (
    p_invitation_id,
    LOWER(BTRIM(p_email)),
    p_invited_user_id,
    v_actor_id,
    p_message,
    'associate',
    v_permissions,
    p_max_users,
    p_max_payment_validations,
    p_access_expires_at,
    v_scope,
    'pending'
  )
  RETURNING * INTO v_inv;

  INSERT INTO public.admin_audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    target_user_id,
    metadata
  )
  VALUES (
    v_actor_id,
    'admin.invite',
    'admin_invitation',
    p_invitation_id,
    p_invited_user_id,
    jsonb_build_object(
      'email', LOWER(BTRIM(p_email)),
      'access_level', 'associate',
      'permission_keys', (
        SELECT COALESCE(jsonb_agg(k), '[]'::jsonb)
        FROM jsonb_object_keys(v_permissions) AS keys(k)
      )
    )
  );

  RETURN v_inv;
END;
$function$;
