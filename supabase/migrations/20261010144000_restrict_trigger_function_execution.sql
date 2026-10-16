-- These routines are trigger functions, not public RPC endpoints.
-- Revoking EXECUTE does not prevent PostgreSQL triggers from invoking them.
REVOKE ALL ON FUNCTION public.enforce_manager_talent_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_registration_consents() FROM PUBLIC, anon, authenticated;
