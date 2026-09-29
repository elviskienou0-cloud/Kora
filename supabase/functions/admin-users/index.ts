import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type JsonRecord = Record<string, unknown>

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

function jsonResponse(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: "Variables Supabase Edge Function manquantes." }, 500)
    }

    const authHeader = req.headers.get("Authorization") || ""
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim()

    if (!accessToken) {
      return jsonResponse({ error: "Authorization manquante." }, 401)
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: callerData, error: callerError } = await callerClient.auth.getUser(accessToken)

    if (callerError || !callerData?.user) {
      return jsonResponse({ error: "Session invalide ou expirée." }, 401)
    }

    const callerId = callerData.user.id

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, name, role, is_suspended")
      .eq("id", callerId)
      .maybeSingle()

    if (profileError) throw profileError
    if (!callerProfile || callerProfile.role !== "admin") {
      return jsonResponse({ error: "Accès administrateur requis." }, 403)
    }
    if (callerProfile.is_suspended === true) {
      return jsonResponse({ error: "Compte administrateur suspendu." }, 403)
    }

    let payload: JsonRecord
    try {
      payload = await req.json()
    } catch {
      return jsonResponse({ error: "Corps de requête JSON invalide." }, 400)
    }

    const action = typeof payload.action === "string" ? payload.action.trim().toLowerCase() : ""
    const userId = typeof payload.user_id === "string" ? payload.user_id.trim() : ""

    if (!action) return jsonResponse({ error: "Action manquante." }, 400)
    if (!userId) return jsonResponse({ error: "Utilisateur manquant." }, 400)
    if (userId === callerId) return jsonResponse({ error: "Cette action n'est pas autorisée sur votre propre compte." }, 409)
    if (action !== "delete") return jsonResponse({ error: `Action inconnue : ${action}` }, 400)

    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("id, name, role, is_suspended, suspended_reason")
      .eq("id", userId)
      .maybeSingle()

    if (targetError) throw targetError
    if (!targetProfile) return jsonResponse({ error: "Utilisateur introuvable." }, 404)
    if (targetProfile.role === "admin") {
      return jsonResponse({ error: "La suppression d'un autre administrateur est bloquée." }, 403)
    }

    const { error: auditError } = await adminClient.from("admin_audit_logs").insert({
      actor_id: callerId,
      action: "user.delete",
      entity_type: "profile",
      entity_id: userId,
      target_user_id: userId,
      metadata: {
        target_name: targetProfile.name,
        target_role: targetProfile.role,
        previous_status: targetProfile.is_suspended ? "suspended" : "active",
        source: "admin-users-edge-function",
      },
    })

    if (auditError) throw auditError

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId, true)
    if (deleteError) throw deleteError

    return jsonResponse({
      ok: true,
      action: "delete",
      deleted_user_id: userId,
      message: "Utilisateur supprimé avec succès.",
    })
  } catch (error) {
    console.error("Erreur Edge Function admin-users:", error)
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Erreur serveur.",
    }, 500)
  }
})
