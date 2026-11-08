-- Restrict direct client-side DML to the exact operations used by KORA.
-- Financial and subscription writes remain available through guarded
-- SECURITY DEFINER RPCs and server-side Edge Functions.
REVOKE UPDATE, DELETE ON TABLE public.messages FROM authenticated;
REVOKE UPDATE (id, conversation_id, sender_id, body, read_at, created_at)
  ON TABLE public.messages FROM authenticated;
DROP POLICY IF EXISTS messages_update ON public.messages;
REVOKE INSERT ON TABLE public.messages FROM authenticated;
REVOKE INSERT (id, conversation_id, sender_id, body, read_at, created_at)
  ON TABLE public.messages FROM authenticated;
GRANT INSERT (conversation_id, sender_id, body)
  ON TABLE public.messages TO authenticated;

-- Users can only update notification read-state fields.
REVOKE UPDATE ON TABLE public.notifications FROM authenticated;
REVOKE UPDATE (id, user_id, type, title, message, link, is_read, created_at, data, read_at)
  ON TABLE public.notifications FROM authenticated;
GRANT UPDATE (is_read, read_at) ON TABLE public.notifications TO authenticated;

-- Only trusted functions/server-side code can mutate payments/subscriptions.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.payments FROM authenticated;
REVOKE INSERT (
  id, user_id, subscription_id, amount, currency, method, transaction_reference,
  proof_url, status, validated_by, validated_at, created_at, provider,
  provider_payment_id, plan_id, reference, billing_cycle, checkout_url,
  paid_at, metadata, updated_at
) ON TABLE public.payments FROM authenticated;
REVOKE UPDATE (
  id, user_id, subscription_id, amount, currency, method, transaction_reference,
  proof_url, status, validated_by, validated_at, created_at, provider,
  provider_payment_id, plan_id, reference, billing_cycle, checkout_url,
  paid_at, metadata, updated_at
) ON TABLE public.payments FROM authenticated;
DROP POLICY IF EXISTS payments_admin_update ON public.payments;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.subscriptions FROM authenticated;
REVOKE INSERT (
  id, user_id, plan, status, starts_at, ends_at, created_at, updated_at,
  plan_id, trial_start, trial_end, current_period_start, current_period_end,
  provider, provider_subscription_id
) ON TABLE public.subscriptions FROM authenticated;
REVOKE UPDATE (
  id, user_id, plan, status, starts_at, ends_at, created_at, updated_at,
  plan_id, trial_start, trial_end, current_period_start, current_period_end,
  provider, provider_subscription_id
) ON TABLE public.subscriptions FROM authenticated;

-- Audit events are append-only through the internal SECURITY DEFINER writer.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.admin_audit_logs FROM authenticated;
REVOKE INSERT (
  id, actor_id, action, entity_type, entity_id, target_user_id, metadata, created_at
) ON TABLE public.admin_audit_logs FROM authenticated;
REVOKE UPDATE (
  id, actor_id, action, entity_type, entity_id, target_user_id, metadata, created_at
) ON TABLE public.admin_audit_logs FROM authenticated;
DROP POLICY IF EXISTS admin_audit_logs_insert ON public.admin_audit_logs;
DROP POLICY IF EXISTS admin_audit_logs_update ON public.admin_audit_logs;
DROP POLICY IF EXISTS admin_audit_logs_delete ON public.admin_audit_logs;
