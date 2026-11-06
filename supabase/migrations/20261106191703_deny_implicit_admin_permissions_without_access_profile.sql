
create or replace function public.get_my_admin_access()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_profile public.admin_access_profiles%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  select *
    into v_profile
  from public.admin_access_profiles
  where user_id = auth.uid();

  if not found then
    -- Seul un véritable Super Admin conserve l'accès intégral
    -- sans ligne dédiée dans admin_access_profiles.
    if public.is_super_admin() then
      return jsonb_build_object(
        'access_level', 'super_admin',
        'permissions', jsonb_build_object('*', true),
        'max_users', null,
        'max_payment_validations', null,
        'access_expires_at', null,
        'scope', jsonb_build_object('*', true),
        'is_active', true
      );
    end if;

    -- Refus par défaut : un admin sans profil explicite
    -- ne reçoit aucune permission.
    return jsonb_build_object(
      'access_level', 'associate',
      'permissions', '{}'::jsonb,
      'max_users', null,
      'max_payment_validations', null,
      'access_expires_at', null,
      'scope', '{}'::jsonb,
      'is_active', false
    );
  end if;

  if v_profile.is_active = false
     or (
       v_profile.access_expires_at is not null
       and v_profile.access_expires_at <= now()
     ) then
    return jsonb_build_object(
      'access_level', 'associate',
      'permissions', '{}'::jsonb,
      'max_users', v_profile.max_users,
      'max_payment_validations', v_profile.max_payment_validations,
      'access_expires_at', v_profile.access_expires_at,
      'scope', v_profile.scope,
      'is_active', false
    );
  end if;

  return jsonb_build_object(
    'access_level', v_profile.access_level,
    'permissions', v_profile.permissions,
    'max_users', v_profile.max_users,
    'max_payment_validations', v_profile.max_payment_validations,
    'access_expires_at', v_profile.access_expires_at,
    'scope', v_profile.scope,
    'is_active', v_profile.is_active
  );
end;
$function$;
