// KORA webhook entry point.
// The selected gateway adapter must verify its signature before changing payment state.
// This endpoint intentionally rejects unconfigured providers instead of trusting client status.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  try {
    const provider = req.headers.get("x-kora-provider") || Deno.env.get("PAYMENT_PROVIDER") || "unconfigured"
    if (provider === "unconfigured") return new Response(JSON.stringify({ error: "Provider non configuré" }), { status: 503, headers: { "Content-Type": "application/json" } })
    // TODO: add provider-specific signature verification and idempotent status update.
    const body = await req.json().catch(() => ({}))
    void body
    createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    return new Response(JSON.stringify({ error: "Webhook adapter not implemented for this provider." }), { status: 501, headers: { "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Webhook error" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }
})
