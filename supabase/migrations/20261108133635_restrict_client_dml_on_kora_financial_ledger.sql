-- Financial ledger and payout rows are written only by trusted database
-- functions or server-side jobs. Authenticated users retain SELECT only.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.kora_transactions FROM authenticated;
REVOKE INSERT (
  id, client_id, manager_id, talent_id, project_id, amount, currency,
  commission_rate, commission_amount, manager_amount, status, provider,
  provider_payment_id, reference, metadata, paid_at, created_at, updated_at
) ON TABLE public.kora_transactions FROM authenticated;
REVOKE UPDATE (
  id, client_id, manager_id, talent_id, project_id, amount, currency,
  commission_rate, commission_amount, manager_amount, status, provider,
  provider_payment_id, reference, metadata, paid_at, created_at, updated_at
) ON TABLE public.kora_transactions FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.kora_payouts FROM authenticated;
REVOKE INSERT (
  id, transaction_id, manager_id, amount, currency, provider,
  provider_payout_id, status, metadata, paid_at, created_at, updated_at
) ON TABLE public.kora_payouts FROM authenticated;
REVOKE UPDATE (
  id, transaction_id, manager_id, amount, currency, provider,
  provider_payout_id, status, metadata, paid_at, created_at, updated_at
) ON TABLE public.kora_payouts FROM authenticated;
