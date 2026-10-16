-- Prevent client-side self-activation of the paid Business plan.
-- Payment approval/webhooks must remain the only activation path.
REVOKE ALL ON FUNCTION public.activate_business_plan() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_business_plan() TO service_role;
