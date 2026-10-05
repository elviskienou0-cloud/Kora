import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type JsonRecord = Record<string, unknown>

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

function jsonResponse(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}



async function removePrefix(storage, bucket, prefix) {
  if (!prefix) return 0
  let removed = 0
  let offset = 0

  while (true) {
    const { data, error } = await storage
      .from(bucket)
      .list(prefix.replace(/\/$/, ""), { limit: 1000, offset })

    if (error) {
      if (/not found|does not exist/i.test(error.message || "")) return removed
      throw error
    }

    const items = data || []
    if (!items.length) break

    const files = []
    for (const item of items) {
      if (!item?.name) continue
      const path = prefix.endsWith("/") ? prefix + item.name : prefix + "/" + item.name
      if (item.id) {
        files.push(path)
      } else {
        removed += await removePrefix(storage, bucket, path + "/")
      }
    }

    if (files.length) {
      const { error: removeError } = await storage.from(bucket).remove(files)
      if (removeError) throw removeError
      removed += files.length
    }

    if (items.length < 1000) break
    offset += items.length
  }

  return removed
}

async function removeOwnedStorageObjects(adminClient, userId) {
  let removed = 0
  let offset = 0

  while (true) {
    const { data, error } = await adminClient
      .from("storage.objects")
      .select("bucket_id,name")
      .eq("owner_id", userId)
      .range(offset, offset + 999)

    if (error) throw error

    const objects = data || []
    if (!objects.length) break

    const byBucket = new Map()
    for (const object of objects) {
      if (!object?.bucket_id || !object?.name) continue
      if (!byBucket.has(object.bucket_id)) byBucket.set(object.bucket_id, [])
      byBucket.get(object.bucket_id).push(object.name)
    }

    for (const [bucket, paths] of byBucket) {
      const { error: removeError } = await adminClient.storage
        .from(bucket)
        .remove(paths)

      if (removeError) throw removeError
      removed += paths.length
    }

    if (objects.length < 1000) break
    offset += objects.length
  }

  return removed
}

async function removeUserStorage(adminClient, userId, talentIds = []) {
  let removed = 0
  removed += await removePrefix(adminClient.storage, "profile-media", `${userId}/`)
  removed += await removePrefix(adminClient.storage, "talent-profile-media", `${userId}/`)
  for (const talentId of talentIds) {
    removed += await removePrefix(adminClient.storage, "talent-portfolio", `${talentId}/`)
  }
  return removed
}

function normalizeAdminRole(role: unknown) {
  const value =
    typeof role === "string" ? role.trim().toLowerCase() : ""

  if (
    value === "superadmin" ||
    value === "super_admin" ||
    value === "super-admin"
  ) {
    return "superadmin"
  }

  if (value === "admin") return "admin"

  return value
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    })
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Méthode non autorisée." },
      405,
    )
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    // Supabase's current secret API keys are injected into Edge Functions
    // through SUPABASE_SECRET_KEYS as a JSON dictionary. Prefer the platform
    // managed secret key instead of duplicating it into a custom environment
    // variable. Keep the custom variable only as a backward-compatible fallback.
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS")
    let platformSecretKey = ""

    if (secretKeysRaw) {
      try {
        const secretKeys = JSON.parse(secretKeysRaw)
        if (
          secretKeys &&
          typeof secretKeys === "object" &&
          typeof secretKeys.default === "string"
        ) {
          platformSecretKey = secretKeys.default
        }
      } catch (error) {
        console.error(
          "admin-users: SUPABASE_SECRET_KEYS invalide",
          error,
        )
      }
    }

    const serviceRoleKey =
      platformSecretKey ||
      Deno.env.get("KORA_SUPABASE_SECRET_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      ""

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse(
        {
          error:
            "Variables Supabase Edge Function manquantes.",
        },
        500,
      )
    }

    const authHeader =
      req.headers.get("Authorization") || ""

    const accessToken = authHeader
      .replace(/^Bearer\s+/i, "")
      .trim()

    if (!accessToken) {
      return jsonResponse(
        { error: "Authorization manquante." },
        401,
      )
    }

    const callerClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { data: callerData, error: callerError } =
      await callerClient.auth.getUser(accessToken)

    if (callerError || !callerData?.user) {
      return jsonResponse(
        { error: "Session invalide ou expirée." },
        401,
      )
    }

    const callerId = callerData.user.id

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const {
      data: callerProfile,
      error: profileError,
    } = await adminClient
      .from("profiles")
      .select(
        "id, name, role, is_suspended",
      )
      .eq("id", callerId)
      .maybeSingle()

    if (profileError) {
      throw profileError
    }

    const callerRole = normalizeAdminRole(
      callerProfile?.role,
    )

    if (
      !callerProfile ||
      !["admin", "superadmin"].includes(
        callerRole,
      )
    ) {
      return jsonResponse(
        {
          error:
            "Accès administrateur requis.",
        },
        403,
      )
    }

    if (callerProfile.is_suspended === true) {
      return jsonResponse(
        {
          error:
            "Compte administrateur suspendu.",
        },
        403,
      )
    }

    let payload: JsonRecord

    try {
      payload = await req.json()
    } catch {
      return jsonResponse(
        {
          error:
            "Corps de requête JSON invalide.",
        },
        400,
      )
    }

    const action =
      typeof payload.action === "string"
        ? payload.action.trim().toLowerCase()
        : ""

    if (!action) {
      return jsonResponse(
        { error: "Action manquante." },
        400,
      )
    }

    // ==========================================================
    // INVITATION ADMIN
    // ==========================================================

    if (action === "invite") {
      const email =
        typeof payload.email === "string"
          ? payload.email.trim().toLowerCase()
          : ""

      const message =
        typeof payload.message === "string"
          ? payload.message.trim()
          : ""

      const accessLevel =
        payload.access_level === "super_admin"
          ? "super_admin"
          : "associate"

      const permissions =
        payload.permissions &&
        typeof payload.permissions === "object"
          ? payload.permissions
          : {}

      const maxUsers =
        payload.max_users === null ||
        payload.max_users === undefined ||
        payload.max_users === ""
          ? null
          : Number(payload.max_users)

      const maxPaymentValidations =
        payload.max_payment_validations === null ||
        payload.max_payment_validations === undefined ||
        payload.max_payment_validations === ""
          ? null
          : Number(payload.max_payment_validations)

      const accessExpiresAt =
        typeof payload.access_expires_at ===
          "string" &&
        payload.access_expires_at
          ? payload.access_expires_at
          : null

      const redirectTo =
        typeof payload.redirect_to === "string" &&
        payload.redirect_to
          ? payload.redirect_to
          : undefined

      if (!email || !email.includes("@")) {
        return jsonResponse(
          {
            error:
              "Adresse email invalide.",
          },
          400,
        )
      }

      if (accessLevel === "super_admin") {
        return jsonResponse(
          {
            error:
              "La création d'un Super Admin doit rester une action CEO protégée.",
          },
          403,
        )
      }

      if (
        (!Number.isFinite(maxUsers ?? 0) &&
          maxUsers !== null)
      ) {
        return jsonResponse(
          {
            error:
              "Limite utilisateurs invalide.",
          },
          400,
        )
      }

      if (
        (!Number.isFinite(
          maxPaymentValidations ?? 0,
        ) &&
          maxPaymentValidations !== null)
      ) {
        return jsonResponse(
          {
            error:
              "Limite de validations invalide.",
          },
          400,
        )
      }

      if (callerRole !== "superadmin") {
        return jsonResponse(
          {
            error:
              "Seul le Super Admin peut inviter un administrateur.",
          },
          403,
        )
      }

      const {
        data: invitedUser,
        error: inviteError,
      } =
        await adminClient.auth.admin.inviteUserByEmail(
          email,
          {
            redirectTo,
            data: {
              kora_invitation_message: message,
              kora_admin_invitation: true,
            },
          },
        )

      if (
        inviteError &&
        (inviteError.code === "email_exists" ||
          inviteError.status === 422)
      ) {
        return jsonResponse(
          {
            error:
              "Cette adresse email a déjà un compte KORA. Une invitation ne peut être envoyée qu'à une nouvelle adresse : utilisez un autre email.",
            code: "email_exists",
          },
          409,
        )
      }

      if (
        inviteError ||
        !invitedUser?.user
      ) {
        return jsonResponse(
          {
            error:
              inviteError?.message ||
              "Impossible d'envoyer l'invitation.",
          },
          400,
        )
      }

      const invitationId =
        crypto.randomUUID()

      const {
        data: invitation,
        error: registerError,
      } = await callerClient.rpc(
        "register_admin_invitation",
        {
          p_invitation_id: invitationId,
          p_invited_user_id:
            invitedUser.user.id,
          p_email: email,
          p_message: message || null,
          p_access_level: accessLevel,
          p_permissions: permissions,
          p_max_users: maxUsers,
          p_max_payment_validations:
            maxPaymentValidations,
          p_access_expires_at:
            accessExpiresAt,
          p_scope: {},
        },
      )

      if (registerError) {
        await adminClient.auth.admin.deleteUser(
          invitedUser.user.id,
          true,
        )

        return jsonResponse(
          {
            error:
              registerError.message,
          },
          400,
        )
      }

      return jsonResponse({
        ok: true,
        action: "invite",
        invitation,
        invited_user_id:
          invitedUser.user.id,
        message:
          "Invitation administrateur envoyée.",
      })
    }

    // ==========================================================
    // SUPPRESSION UTILISATEUR
    // ==========================================================

    const userId =
      typeof payload.user_id === "string"
        ? payload.user_id.trim()
        : ""

    if (!userId) {
      return jsonResponse(
        {
          error:
            "Utilisateur manquant.",
        },
        400,
      )
    }

    if (userId === callerId) {
      return jsonResponse(
        {
          error:
            "Cette action n'est pas autorisée sur votre propre compte.",
        },
        409,
      )
    }

    if (action !== "delete") {
      return jsonResponse(
        {
          error:
            `Action inconnue : ${action}`,
        },
        400,
      )
    }

    const {
      data: targetProfile,
      error: targetError,
    } = await adminClient
      .from("profiles")
      .select(
        "id, name, role, is_suspended, suspended_reason",
      )
      .eq("id", userId)
      .maybeSingle()

    if (targetError) {
      throw targetError
    }

    if (!targetProfile) {
      return jsonResponse(
        {
          error:
            "Utilisateur introuvable.",
        },
        404,
      )
    }

    const targetRole = normalizeAdminRole(
      targetProfile.role,
    )

    const isSuperAdmin =
      callerRole === "superadmin"

    const targetIsAdmin =
      targetRole === "admin"

    const targetIsSuperAdmin =
      targetRole === "superadmin"

    // Protection absolue du CEO
    if (targetIsSuperAdmin) {
      return jsonResponse(
        {
          error:
            "Un Super Admin/CEO ne peut pas être supprimé depuis cette interface.",
        },
        403,
      )
    }

    // Seul le CEO peut supprimer un autre admin
    if (
      targetIsAdmin &&
      !isSuperAdmin
    ) {
      return jsonResponse(
        {
          error:
            "Seul le Super Admin (CEO) peut supprimer un autre administrateur.",
        },
        403,
      )
    }

    // Les admins associés doivent avoir users.manage
    if (!isSuperAdmin) {
      const {
        data: canManageUsers,
        error: permissionError,
      } = await callerClient.rpc(
        "admin_has_permission",
        {
          p_permission:
            "users.manage",
        },
      )

      if (permissionError) {
        console.error(
          "admin-users: erreur users.manage",
          permissionError,
        )

        return jsonResponse(
          {
            error:
              "Impossible de vérifier la permission users.manage.",
            details:
              permissionError.message,
          },
          500,
        )
      }

      if (canManageUsers !== true) {
        return jsonResponse(
          {
            error:
              "Permission users.manage requise pour cet administrateur.",
            code:
              "MISSING_PERMISSION",
          },
          403,
        )
      }
    }

    const { data: targetTalents, error: targetTalentsError } = await adminClient
      .from("talent_profiles")
      .select("id")
      .eq("managed_by", userId)

    if (targetTalentsError) {
      throw targetTalentsError
    }

    const talentIds = (targetTalents || []).map((row) => row.id).filter(Boolean)

    // Supabase Auth ne supprime pas un utilisateur tant que des objets
    // Storage lui appartiennent. On traite d'abord owner_id (tous les buckets),
    // puis les anciens chemins KORA créés via service role sans owner_id.
    const ownedStorageObjects = await removeOwnedStorageObjects(adminClient, userId)
    const prefixedStorageObjects = await removeUserStorage(adminClient, userId, talentIds)
    const deletedStorageObjects =
      ownedStorageObjects + prefixedStorageObjects

    const { count: remainingOwnedObjects, error: remainingStorageError } =
      await adminClient
        .from("storage.objects")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId)

    if (remainingStorageError) throw remainingStorageError

    if ((remainingOwnedObjects || 0) > 0) {
      throw new Error(
        "Des fichiers Storage appartiennent encore à ce compte.",
      )
    }

    // ==========================================================
    // AUDIT AVANT SUPPRESSION
    // ==========================================================

    const {
      error: auditError,
    } = await adminClient
      .from("admin_audit_logs")
      .insert({
        actor_id: callerId,
        action: "user.delete",
        entity_type: "profile",
        entity_id: userId,
        target_user_id: userId,
        metadata: {
          target_name:
            targetProfile.name,
          target_role:
            targetProfile.role,
          previous_status:
            targetProfile.is_suspended
              ? "suspended"
              : "active",
          source:
            "admin-users-edge-function",
          deletion_mode:
            "complete",
        },
      })

    if (auditError) {
      throw auditError
    }

    // ==========================================================
    // SUPPRESSION DES DONNÉES PUBLIQUES
    // ==========================================================

    const {
      data: cleanupData,
      error: cleanupError,
    } = await adminClient.rpc(
      "admin_delete_user_data",
      {
        p_user_id: userId,
      },
    )

    if (cleanupError) {
      throw new Error(
        `Nettoyage des données utilisateur impossible : ${cleanupError.message}`,
      )
    }

    if (!cleanupData?.ok) {
      throw new Error(
        cleanupData?.error ||
          "Le nettoyage des données utilisateur a échoué.",
      )
    }

    // ==========================================================
    // SUPPRESSION DU COMPTE AUTH
    // ==========================================================

    const {
      error: deleteError,
    } =
      await adminClient.auth.admin.deleteUser(
        userId,
        false,
      )

    if (deleteError) {
      throw new Error(
        `Données KORA nettoyées, mais le compte Auth n'a pas pu être supprimé : ${deleteError.message}`,
      )
    }

    return jsonResponse({
      ok: true,
      action: "delete",
      deleted_user_id: userId,
      deleted_rows:
        cleanupData.deleted_rows ?? 0,
      deleted_storage_objects: deletedStorageObjects,
      storage_cleanup: "effectué",
      message:
        "Utilisateur, profil, données liées et compte Auth supprimés avec succès.",
    })
  } catch (error) {
    console.error(
      "Erreur Edge Function admin-users:",
      error,
    )

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur.",
      },
      500,
    )
  }
})