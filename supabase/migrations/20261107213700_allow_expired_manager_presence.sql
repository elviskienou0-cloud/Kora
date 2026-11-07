-- Permit only the technical presence timestamp to update for expired managers.
-- All other writes remain blocked by the global expired-manager guard.
CREATE OR REPLACE FUNCTION public.reject_expired_manager_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  actor_id uuid;
  actor_role text;
BEGIN
  actor_id := auth.uid();

  -- Service-side jobs/webhooks have no end-user JWT and are not treated as a manager.
  IF actor_id IS NULL THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  actor_role := public.get_my_role();

  IF actor_role = 'manager'
     AND NOT public.is_admin()
     AND NOT public.manager_has_active_plan() THEN

    -- The presence heartbeat is non-business metadata. Allow this one-column
    -- update so expired managers can still appear online, while preventing
    -- any simultaneous edit to profile identity, role, subscription or status.
    -- The identity-protection trigger runs first and updates updated_at, so
    -- compare all other columns except last_seen and that managed timestamp.
    IF TG_OP = 'UPDATE'
       AND TG_TABLE_SCHEMA = 'public'
       AND TG_TABLE_NAME = 'profiles'
       AND OLD.id = actor_id
       AND NEW.id = actor_id
       AND NEW.last_seen IS DISTINCT FROM OLD.last_seen
       AND (to_jsonb(NEW) - 'last_seen' - 'updated_at') = (to_jsonb(OLD) - 'last_seen' - 'updated_at') THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'SUBSCRIPTION_EXPIRED: manager account is read-only until renewal'
      USING ERRCODE = '42501';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;
