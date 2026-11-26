-- KORA-015: interdire la configuration d'un taux de commission.
-- Le modèle de revenus KORA repose uniquement sur les abonnements.
CREATE OR REPLACE FUNCTION public.update_kora_setting(p_key text, p_value jsonb)
 RETURNS app_settings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_setting public.app_settings;
begin
  if not public.is_super_admin() then
    raise exception 'Accès Super Admin requis'
      using errcode = '42501';
  end if;

  if p_key = 'commission_rate' then
    raise exception 'KORA ne prélève aucune commission; ce paramètre est interdit';
  end if;

  update public.app_settings
  set value = p_value, updated_by = auth.uid(), updated_at = now()
  where key = p_key
  returning * into v_setting;

  if not found then
    insert into public.app_settings (key, value, description, is_public, updated_by)
    values (p_key, p_value, 'Paramètre KORA', true, auth.uid())
    returning * into v_setting;
  end if;

  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'update_setting', 'app_setting', null,
    jsonb_build_object('key', p_key, 'value', p_value)
  );

  return v_setting;
end;
$function$

