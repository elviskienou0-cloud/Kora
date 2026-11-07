import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeadersForRequest, corsPreflightResponse, isAllowedCorsOrigin } from "../_shared/cors.ts"
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const SASPAY_LINKS: Record<string, string> = {
  PRO: "https://link.saspay.me/ozk-dberun4",
  BUSINESS: "https://link.saspay.me/byms-p2qna0",
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function getSecretKey(): string | null {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS")
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.default) return parsed.default
    } catch {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SECRET_KEY") ||
    null
}

function getPublishableKey(): string {
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")

  if (raw) {
    try {
      const keys = JSON.parse(raw)
      if (
        keys &&
        typeof keys === "object" &&
        typeof keys.default === "string" &&
        keys.default.trim()
      ) {
        return keys.default
      }
    } catch (error) {
      console.error("SUPABASE_PUBLISHABLE_KEYS invalide", error)
    }
  }

  // Backward-compatible fallback while legacy anon keys are still supported.
  return Deno.env.get("SUPABASE_ANON_KEY") || ""
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse(req)
  if (!isAllowedCorsOrigin(req)) return jsonResponse({ error: "Origine non autorisée." }, 403, req, req)
  if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée" }, 405, req)

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = getPublishableKey()
    const secretKey = getSecretKey()

    if (!supabaseUrl || !anonKey || !secretKey) {
      return jsonResponse({ error: "Configuration serveur Supabase incomplète." }, 503, req)
    }

    const authorization = req.headers.get("Authorization")
    if (!authorization) return jsonResponse({ error: "Authorization requise." }, 401, req)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return jsonResponse({ error: "Session utilisateur invalide." }, 401, req)

    const body = await req.json().catch(() => ({}))
    const planId = String(body?.plan_id || "")
    const billingCycle = String(body?.billing_cycle || "monthly")

    if (!["PRO", "BUSINESS"].includes(planId)) {
      return jsonResponse({ error: "Ce plan ne nécessite pas de paiement SasPay." }, 400, req)
    }

    if (billingCycle !== "monthly") {
      return jsonResponse({ error: "KORA utilise actuellement un abonnement mensuel." }, 400, req)
    }

    const { data: plan, error: planError } = await userClient
      .from("plans")
      .select("id,name,price,currency,duration_months,is_active")
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle()

    if (planError) throw planError
    if (!plan) return jsonResponse({ error: "Plan introuvable ou désactivé." }, 404, req)

    const expectedAmount = planId === "PRO" ? 2500 : 5000
    if (Number(plan.price) !== expectedAmount || plan.currency !== "XOF") {
      return jsonResponse({ error: "Configuration tarifaire KORA invalide." }, 409, req)
    }

    const { data: payment, error: paymentError } = await userClient.rpc(
      "create_subscription_payment",
      {
        p_plan_id: planId,
        p_billing_cycle: "monthly",
        p_provider: "saspay",
      },
    )

    if (paymentError) throw paymentError
    if (!payment?.id) return jsonResponse({ error: "Impossible de créer le paiement KORA." }, 500, req)

    const checkoutUrl = SASPAY_LINKS[planId]
    const reference = payment.reference || `KORA-${crypto.randomUUID()}`

    const adminClient = createClient(supabaseUrl, secretKey)
    const { error: updateError } = await adminClient
      .from("payments")
      .update({
        provider: "saspay",
        provider_payment_id: null,
        transaction_reference: reference,
        checkout_url: checkoutUrl,
        metadata: {
          source: "kora_subscription",
          provider: "saspay",
          validation_mode: "manual_admin",
          plan_id: planId,
          amount: expectedAmount,
          currency: "XOF",
          billing_cycle: "monthly",
          saspay_checkout_url: checkoutUrl,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)

    if (updateError) throw updateError

    return jsonResponse({
      success: true,
      payment_id: payment.id,
      reference,
      provider: "saspay",
      status: "pending",
      validation_mode: "manual_admin",
      checkout_url: checkoutUrl,
      amount: expectedAmount,
      currency: "XOF",
      plan_id: planId,
      billing_cycle: "monthly",
    }, req)
  } catch (error) {
    console.error("create-payment fatal error:", error)
    return jsonResponse({
      error: error instanceof Error ? error.message : "Erreur inattendue lors de la création du paiement.",
    }, 500, req)
  }
})
