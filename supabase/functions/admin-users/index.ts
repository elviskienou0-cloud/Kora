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
    if (!callerProfile || !["admin", "superadmin"].includes(callerProfile.role)) {
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

    if (!action) return jsonResponse({ error: "Action manquante." }, 400)

    if (action === "invite") {
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : ""
      const message = typeof payload.message === "string" ? payload.message.trim() : ""
      const accessLevel = payload.access_level === "super_admin" ? "super_admin" : "associate"
      const permissions = payload.permissions && typeof payload.permissions === "object"
        ? payload.permissions
        : {}
      const maxUsers = payload.max_users === null || payload.max_users === undefined || payload.max_users === ""
        ? null
        : Number(payload.max_users)
      const maxPaymentValidations = payload.max_payment_validations === null || payload.max_payment_validations === undefined || payload.max_payment_validations === ""
        ? null
        : Number(payload.max_payment_validations)
      const accessExpiresAt = typeof payload.access_expires_at === "string" && payload.access_expires_at
        ? payload.access_expires_at
        : null
      const redirectTo = typeof payload.redirect_to === "string" && payload.redirect_to
        ? payload.redirect_to
        : undefined

      if (!email || !email.includes("@")) {
        return jsonResponse({ error: "Adresse email invalide." }, 400)
      }

      if (accessLevel === "super_admin") {
        return jsonResponse({ error: "La création d'un Super Admin doit rester une action CEO protégée." }, 403)
      }

      if (!Number.isFinite(maxUsers ?? 0) && maxUsers !== null) {
        return jsonResponse({ error: "Limite utilisateurs invalide." }, 400)
      }

      if (!Number.isFinite(maxPaymentValidations ?? 0) && maxPaymentValidations !== null) {
        return jsonResponse({ error: "Limite de validations invalide." }, 400)
      }

      const { data: isSuperAdmin, error: accessError } = await callerClient.rpc("is_super_admin")
      if (accessError || isSuperAdmin !== true) {
        return jsonResponse({ error: "Seul le Super Admin peut inviter un administrateur." }, 403)
      }

      const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          kora_invitation_message: message,
          kora_admin_invitation: true,
        },
      })

      if (inviteError && (inviteError.code === "email_exists" || inviteError.status === 422)) {
        return jsonResponse({
          error: "Cette adresse email a déjà un compte KORA. Une invitation ne peut être envoyée qu'à une nouvelle adresse : utilisez un autre email.",
          code: "email_exists",
        }, 409)
      }

      if (inviteError || !invitedUser?.user) {
        return jsonResponse({
          error: inviteError?.message || "Impossible d'envoyer l'invitation.",
        }, 400)
      }

      const invitationId = crypto.randomUUID()

      const { data: invitation, error: registerError } = await callerClient.rpc(
        "register_admin_invitation",
        {
          p_invitation_id: invitationId,
          p_invited_user_id: invitedUser.user.id,
          p_email: email,
          p_message: message || null,
          p_access_level: accessLevel,
          p_permissions: permissions,
          p_max_users: maxUsers,
          p_max_payment_validations: maxPaymentValidations,
          p_access_expires_at: accessExpiresAt,
          p_scope: {},
        },
      )

      if (registerError) {
        await adminClient.auth.admin.deleteUser(invitedUser.user.id, true)
        return jsonResponse({
          error: registerError.message,
        }, 400)
      }

      return jsonResponse({
        ok: true,
        action: "invite",
        invitation,
        invited_user_id: invitedUser.user.id,
        message: "Invitation administrateur envoyée.",
      })
    }

    const userId = typeof payload.user_id === "string" ? payload.user_id.trim() : ""

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
    if (targetProfile.role === "admin" || targetProfile.role === "superadmin") {
      return jsonResponse({ error: "La suppression d'un administrateur est bloquée depuis cette action." }, 403)
    }

    // Le Super Admin a tous les droits. Un admin associé doit avoir
    // explicitement la permission users.manage.
    const { data: isSuperAdmin, error: superAdminError } = await callerClient.rpc("is_super_admin")

    if (superAdminError) {
      console.error("admin-users: erreur is_super_admin", superAdminError)
      return jsonResponse({
        error: "Impossible de vérifier les droits administrateur.",
        details: superAdminError.message,
      }, 500)
    }

    if (isSuperAdmin !== true) {
      const { data: canManageUsers, error: permissionError } = await callerClient.rpc(
        "admin_has_permission",
        { p_permission: "users.manage" },
      )

      if (permissionError) {
        console.error("admin-users: erreur users.manage", permissionError)
        return jsonResponse({
          error: "Impossible de vérifier la permission users.manage.",
          details: permissionError.message,
        }, 500)
      }

      if (canManageUsers !== true) {
        return jsonResponse({
          error: "Permission users.manage requise pour cet administrateur.",
          code: "MISSING_PERMISSION",
        }, 403)
      }
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