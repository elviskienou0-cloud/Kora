-- KORA security hardening: these are internal guard helpers called by
-- SECURITY DEFINER RPCs. They are not intended as direct client RPC endpoints.
-- Nested calls from functions owned by postgres continue to work.
REVOKE EXECUTE ON FUNCTION public.admin_require_permission(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_require_any_permission(text[]) FROM PUBLIC, anon, authenticated;
