-- Notifications are created by trusted RPCs/Edge Functions. Users can read,
-- mark read and delete only their own rows, but cannot forge new notifications.
REVOKE INSERT ON TABLE public.notifications FROM authenticated;
REVOKE INSERT (
  id, user_id, type, title, message, link, is_read, created_at, data, read_at
) ON TABLE public.notifications FROM authenticated;
DROP POLICY IF EXISTS notifications_insert ON public.notifications;

-- Consent records are written only by the registration trigger and the
-- set_my_marketing_consent() SECURITY DEFINER RPC. Keep user-owned reads.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_consents FROM authenticated;
REVOKE INSERT (
  id, user_id, consent_type, consent_given, policy_version, source,
  granted_at, revoked_at, created_at
) ON TABLE public.user_consents FROM authenticated;
REVOKE UPDATE (
  id, user_id, consent_type, consent_given, policy_version, source,
  granted_at, revoked_at, created_at
) ON TABLE public.user_consents FROM authenticated;
DROP POLICY IF EXISTS "Users can update their marketing consent" ON public.user_consents;

-- Activity history is append-only from the authenticated client side.
REVOKE UPDATE, DELETE ON TABLE public.activity_logs FROM authenticated;
REVOKE UPDATE (
  id, user_id, action, entity_type, entity_id, metadata, created_at
) ON TABLE public.activity_logs FROM authenticated;
