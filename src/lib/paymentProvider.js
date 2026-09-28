// KORA Payment Provider Adapter.
// No payment secret belongs in the frontend.
// Gateway credentials and webhook verification live in Supabase Edge Functions.

export const PAYMENT_PROVIDER = {
  UNCONFIGURED: "unconfigured",
}

export function getPaymentProvider() {
  return import.meta.env.VITE_PAYMENT_PROVIDER || PAYMENT_PROVIDER.UNCONFIGURED
}
