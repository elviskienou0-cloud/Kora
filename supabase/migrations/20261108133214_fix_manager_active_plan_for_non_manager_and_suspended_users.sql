-- Ensure a non-manager or suspended account receives false instead of
-- reaching the manager-only subscription helper.
CREATE OR REPLACE FUNCTION public.manager_has_active_plan()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
BEGIN
  IF v_user IS NULL
     OR public.get_my_role() IS DISTINCT FROM 'manager' THEN
    RETURN false;
  END IF;

  v_sub := public.ensure_my_manager_subscription();

  RETURN v_sub.status IN ('trialing', 'active')
    AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now());
END;
$function$;
