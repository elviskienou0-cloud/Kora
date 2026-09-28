// KORA payment gateway adapter (provider-neutral).
// Configure PAYMENT_PROVIDER and its secrets later in Supabase Edge Function secrets.
// Do not put gateway private keys in VITE_* variables.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  try {
    const auth = req.headers.get("Authorization")
    if (!auth) throw new Error("Authorization requise")

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
    const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } })
    const adminClient = createClient(supabaseUrl, adminKey)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) throw new Error("Session invalide")

    const body = await req.json().catch(() => ({}))
    const planId = body?.plan_id
    const billingCycle = body?.billing_cycle || "monthly"
    const provider = body?.provider || Deno.env.get("PAYMENT_PROVIDER") || "unconfigured"
    if (!planId) throw new Error("plan_id est obligatoire")

    const { data: payment, error } = await userClient.rpc("create_subscription_payment", {
      p_plan_id: planId,
      p_billing_cycle: billingCycle,
      p_provider: provider,
    })
    if (error) throw error

    if (provider === "unconfigured") {
      return new Response(JSON.stringify({
        error: "La passerelle de paiement KORA n'est pas encore configurée.",
        payment_id: payment?.id,
        reference: payment?.reference,
        status: "pending",
        provider: "unconfigured",
      }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } })
    }

    // Provider adapter hook:
    // 1. create checkout with the selected gateway
    // 2. return checkout_url + provider_payment_id
    // 3. webhook later confirms payment server-side.
    // No provider-specific implementation is assumed until credentials/API are supplied.
    void adminClient
    return new Response(JSON.stringify({
      error: "Provider sélectionné mais adaptateur non implémenté.",
      payment_id: payment?.id,
      reference: payment?.reference,
      provider,
    }), { status: 501, headers: { ...cors, "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "Erreur paiement" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }
})
