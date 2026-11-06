-- KORA: secure admin invitation acceptance and central suspension enforcement.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin','superadmin')
      AND COALESCE(p.is_suspended,false) = false
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = auth.uid()
      AND COALESCE(p.is_suspended,false) = false
      AND (
        p.role = 'superadmin'
        OR (
          p.role = 'admin'
          AND EXISTS (
            SELECT 1 FROM public.admin_access_profiles AS a
            WHERE a.user_id = p.id
              AND a.access_level = 'super_admin'
              AND a.is_active = true
              AND (a.access_expires_at IS NULL OR a.access_expires_at > now())
          )
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.admin_has_permission(p_permission text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE v_access jsonb;
BEGIN
  IF auth.uid() IS NULL OR NULLIF(BTRIM(p_permission),'') IS NULL
     OR NOT public.is_admin() THEN RETURN false; END IF;
  IF public.is_super_admin() THEN RETURN true; END IF;
  v_access := public.get_my_admin_access();
  IF COALESCE((v_access->>'is_active')::boolean,false) = false THEN RETURN false; END IF;
  RETURN COALESCE((v_access->'permissions'->p_permission)::boolean,false)
      OR COALESCE((v_access->'permissions'->'*')::boolean,false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_require_permission(p_permission text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès administrateur requis ou compte suspendu' USING ERRCODE = '42501';
  END IF;
  IF NOT public.admin_has_permission(p_permission) THEN
    RAISE EXCEPTION 'Permission administrateur insuffisante: %', p_permission USING ERRCODE = '42501';
  END IF;
END;
$function$;

-- Register a pending invitation only; no role or active access is granted here.
CREATE OR REPLACE FUNCTION public.register_admin_invitation(
  p_invitation_id uuid,p_invited_user_id uuid,p_email text,p_message text,
  p_access_level text DEFAULT 'associate',p_permissions jsonb DEFAULT '{}'::jsonb,
  p_max_users integer DEFAULT NULL,p_max_payment_validations integer DEFAULT NULL,
  p_access_expires_at timestamptz DEFAULT NULL,p_scope jsonb DEFAULT '{}'::jsonb
)
RETURNS public.admin_invitations LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_inv public.admin_invitations;
  v_actor uuid := auth.uid();
  v_target_role text;
  v_auth_email text;
  v_invited_at timestamptz;
  v_permissions jsonb := COALESCE(p_permissions,'{}'::jsonb);
  v_scope jsonb := COALESCE(p_scope,'{}'::jsonb);
  v_key text;
  v_value jsonb;
BEGIN
  IF v_actor IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Accès Super Admin requis' USING ERRCODE = '42501';
  END IF;
  IF p_invitation_id IS NULL OR p_invited_user_id IS NULL OR p_invited_user_id = v_actor THEN
    RAISE EXCEPTION 'Identifiants invalides ou auto-invitation interdite';
  END IF;
  IF p_access_level IS DISTINCT FROM 'associate' THEN
    RAISE EXCEPTION 'Seul le niveau associate peut être attribué par invitation' USING ERRCODE = '42501';
  END IF;
  IF p_email IS NULL OR BTRIM(p_email) = '' OR POSITION('@' IN BTRIM(p_email)) <= 1 THEN
    RAISE EXCEPTION 'Adresse email invalide';
  END IF;
  IF jsonb_typeof(v_permissions) IS DISTINCT FROM 'object' OR jsonb_typeof(v_scope) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Permissions et périmètre doivent être des objets JSON';
  END IF;
  FOR v_key,v_value IN SELECT e.key,e.value FROM jsonb_each(v_permissions) AS e LOOP
    IF v_key NOT IN (
      'users.read','users.manage','clients.read','managers.read','talents.read','talents.manage',
      'requests.read','projects.read','payments.read','payments.validate','subscriptions.read',
      'subscriptions.manage','moderation.read','moderation.manage','messages.read','logs.read',
      'notifications.write','announcements.write','settings.read'
    ) THEN RAISE EXCEPTION 'Permission inconnue ou interdite : %',v_key USING ERRCODE='22023'; END IF;
    IF jsonb_typeof(v_value) IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'La permission % doit être booléenne',v_key USING ERRCODE='22023';
    END IF;
  END LOOP;
  IF p_max_users IS NOT NULL AND p_max_users < 0 THEN RAISE EXCEPTION 'La limite utilisateurs ne peut pas être négative'; END IF;
  IF p_max_payment_validations IS NOT NULL AND p_max_payment_validations < 0 THEN RAISE EXCEPTION 'La limite de validations ne peut pas être négative'; END IF;
  IF p_access_expires_at IS NOT NULL AND p_access_expires_at <= now() THEN RAISE EXCEPTION 'La date d’expiration doit être dans le futur'; END IF;

  SELECT lower(u.email),u.invited_at INTO v_auth_email,v_invited_at
  FROM auth.users AS u WHERE u.id=p_invited_user_id;
  IF NOT FOUND OR v_invited_at IS NULL THEN RAISE EXCEPTION 'Compte Auth invité introuvable ou non issu du flux d’invitation'; END IF;
  IF v_auth_email IS DISTINCT FROM lower(BTRIM(p_email)) THEN RAISE EXCEPTION 'L’adresse email ne correspond pas au compte invité'; END IF;

  SELECT p.role INTO v_target_role FROM public.profiles AS p WHERE p.id=p_invited_user_id FOR UPDATE;
  IF NOT FOUND OR v_target_role IS DISTINCT FROM 'client' THEN
    RAISE EXCEPTION 'Seul un nouveau compte client peut être invité comme administrateur';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_access_profiles a WHERE a.user_id=p_invited_user_id)
     OR EXISTS (SELECT 1 FROM public.admin_invitations i WHERE i.id=p_invitation_id) THEN
    RAISE EXCEPTION 'Un profil administrateur ou cet identifiant d’invitation existe déjà';
  END IF;

  INSERT INTO public.admin_invitations(
    id,email,invited_user_id,invited_by,message,access_level,permissions,max_users,
    max_payment_validations,access_expires_at,scope,status
  ) VALUES (
    p_invitation_id,lower(BTRIM(p_email)),p_invited_user_id,v_actor,p_message,'associate',
    v_permissions,p_max_users,p_max_payment_validations,p_access_expires_at,v_scope,'pending'
  ) RETURNING * INTO v_inv;

  PERFORM public.write_admin_audit_log_internal(
    'admin.invite','admin_invitation',p_invitation_id,p_invited_user_id,
    jsonb_build_object('email',lower(BTRIM(p_email)),'access_level','associate',
      'permission_keys',(SELECT COALESCE(jsonb_agg(k),'[]'::jsonb) FROM jsonb_object_keys(v_permissions) AS keys(k)))
  );
  RETURN v_inv;
END;
$function$;

-- The authenticated invitee can accept only their own confirmed pending invite.
CREATE OR REPLACE FUNCTION public.accept_my_admin_invitation()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_confirmed_at timestamptz;
  v_inv public.admin_invitations%ROWTYPE;
  v_profile_role text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentification requise' USING ERRCODE='42501'; END IF;
  SELECT lower(u.email),u.email_confirmed_at INTO v_email,v_confirmed_at
  FROM auth.users AS u WHERE u.id=v_user_id;
  IF NOT FOUND OR v_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Confirmez votre adresse email avant d’accepter l’invitation' USING ERRCODE='42501';
  END IF;

  SELECT i.* INTO v_inv FROM public.admin_invitations AS i
  WHERE i.invited_user_id=v_user_id AND lower(i.email)=v_email AND i.status='pending'
  ORDER BY i.created_at DESC LIMIT 1 FOR UPDATE;

  IF NOT FOUND THEN
    SELECT i.* INTO v_inv FROM public.admin_invitations AS i
    WHERE i.invited_user_id=v_user_id AND lower(i.email)=v_email AND i.status='accepted'
    ORDER BY i.accepted_at DESC LIMIT 1;
    IF FOUND THEN RETURN jsonb_build_object('accepted',true,'already_accepted',true,'invitation_id',v_inv.id); END IF;
    RETURN jsonb_build_object('accepted',false);
  END IF;

  IF v_inv.access_level <> 'associate' THEN RAISE EXCEPTION 'Niveau d’invitation non autorisé'; END IF;
  IF v_inv.access_expires_at IS NOT NULL AND v_inv.access_expires_at <= now() THEN
    UPDATE public.admin_invitations SET status='expired' WHERE id=v_inv.id;
    RETURN jsonb_build_object('accepted',false,'expired',true);
  END IF;

  SELECT p.role INTO v_profile_role FROM public.profiles AS p WHERE p.id=v_user_id FOR UPDATE;
  IF NOT FOUND OR v_profile_role IS DISTINCT FROM 'client' THEN
    RAISE EXCEPTION 'Le profil ne peut pas être activé comme administrateur' USING ERRCODE='42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_access_profiles a WHERE a.user_id=v_user_id) THEN
    RAISE EXCEPTION 'Un profil d’accès administrateur existe déjà' USING ERRCODE='23505';
  END IF;

  UPDATE public.profiles SET role='admin',updated_at=now() WHERE id=v_user_id;
  INSERT INTO public.admin_access_profiles(
    user_id,access_level,permissions,max_users,max_payment_validations,access_expires_at,
    scope,is_active,created_by,updated_by
  ) VALUES (
    v_user_id,'associate',v_inv.permissions,v_inv.max_users,v_inv.max_payment_validations,
    v_inv.access_expires_at,v_inv.scope,true,v_inv.invited_by,v_user_id
  );
  UPDATE public.admin_invitations SET status='accepted',accepted_at=now()
  WHERE id=v_inv.id RETURNING * INTO v_inv;

  PERFORM public.write_admin_audit_log_internal(
    'admin.invitation.accept','admin_invitation',v_inv.id,v_user_id,
    jsonb_build_object('access_level','associate')
  );
  RETURN jsonb_build_object('accepted',true,'already_accepted',false,'invitation_id',v_inv.id);
END;
$function$;

REVOKE ALL ON FUNCTION public.accept_my_admin_invitation() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_my_admin_invitation() TO authenticated;
REVOKE ALL ON FUNCTION public.register_admin_invitation(uuid,uuid,text,text,text,jsonb,integer,integer,timestamptz,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_admin_invitation(uuid,uuid,text,text,text,jsonb,integer,integer,timestamptz,jsonb) TO authenticated;
