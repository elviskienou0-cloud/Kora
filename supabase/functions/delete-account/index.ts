import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeadersForRequest, corsPreflightResponse, isAllowedCorsOrigin } from "../_shared/cors.ts"
function json(body: Record<string, unknown>, status = 200, request: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json" },
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
      // A bucket may not exist on an older deployment.
      if (/not found|does not exist/i.test(error.message || "")) return removed
      throw error
    }

    const items = data || []
    if (!items.length) break

    const files = []
    for (const item of items) {
      const name = item?.name
      if (!name) continue
      const path = prefix.endsWith("/") ? prefix + name : prefix + "/" + name

      // Supabase Storage represents folders without an object id.
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
      const { error: removeError } = await adminClient.storage.from(bucket).remove(paths)
      if (removeError) throw removeError
      removed += paths.length
    }

    if (objects.length < 1000) break
    offset += objects.length
  }

  return removed
}

async function removeUserStorage(adminClient, userId) {
  let removed = 0

  const { data: talents, error: talentError } = await adminClient
    .from("talent_profiles")
    .select("id")
    .eq("managed_by", userId)

  if (talentError) throw talentError

  const talentIds = (talents || []).map((row) => row.id).filter(Boolean)

  removed += await removePrefix(
    adminClient.storage,
    "profile-media",
    `${userId}/`
  )

  removed += await removePrefix(
    adminClient.storage,
    "talent-profile-media",
    `${userId}/`
  )

  for (const talentId of talentIds) {
    removed += await removePrefix(
      adminClient.storage,
      "talent-portfolio",
      `${talentId}/`
    )
  }

  return removed
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
  if (!isAllowedCorsOrigin(req)) return json({ error: "Origine non autorisée." }, 403, req, req)
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405, req)

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = getPublishableKey()
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS")
    let platformSecretKey = ""

    if (secretKeysRaw) {
      try {
        const parsed = JSON.parse(secretKeysRaw)
        if (parsed && typeof parsed.default === "string") {
          platformSecretKey = parsed.default
        }
      } catch {
        // Fallback below.
      }
    }

    const serviceRoleKey =
      platformSecretKey ||
      Deno.env.get("KORA_SUPABASE_SECRET_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      ""

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Configuration Supabase Edge Function manquante." }, 500, req)
    }

    const authHeader = req.headers.get("Authorization") || ""
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim()
    if (!accessToken) return json({ error: "Authorization manquante." }, 401, req)

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: authData, error: authError } =
      await callerClient.auth.getUser(accessToken)

    if (authError || !authData?.user) {
      return json({ error: "Session invalide ou expirée." }, 401, req)
    }

    const userId = authData.user.id

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle()

    if (profileError) throw profileError
    if (!profile) return json({ error: "Profil utilisateur introuvable." }, 404, req)

    const role = String(profile.role || "").trim().toLowerCase()
    if (role === "admin" || role === "superadmin") {
      return json({
        error: "La suppression d'un compte administrateur doit passer par le processus administrateur sécurisé.",
      }, 403, req)
    }

    // Supabase refuse la suppression d'un Auth user tant qu'il possède des
  // objets Storage. On supprime d'abord tous ses objets par l'API Storage,
  // puis les chemins KORA créés via service role qui peuvent ne pas avoir
  // owner_id.
  const ownedStorageObjects = await removeOwnedStorageObjects(adminClient, userId)
  const prefixedStorageObjects = await removeUserStorage(adminClient, userId)
  const storageObjects = ownedStorageObjects + prefixedStorageObjects

  const { count: remainingOwnedObjects, error: remainingStorageError } =
    await adminClient
      .from("storage.objects")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)

  if (remainingStorageError) throw remainingStorageError
  if ((remainingOwnedObjects || 0) > 0) {
    throw new Error("Des fichiers Storage appartiennent encore à ce compte.")
  }

    const { data: cleanup, error: cleanupError } =
      await adminClient.rpc("delete_user_data_v3", { p_user_id: userId })

    if (cleanupError) {
      throw new Error(`Nettoyage des données impossible : ${cleanupError.message}`)
    }

    if (!cleanup?.ok) {
      throw new Error(cleanup?.error || "La suppression des données a échoué.")
    }

    const { error: deleteAuthError } =
      await adminClient.auth.admin.deleteUser(userId, false)

    if (deleteAuthError) {
      throw new Error(
        `Les données ont été nettoyées mais le compte Auth n'a pas pu être supprimé : ${deleteAuthError.message}`
      )
    }

    return json({
      ok: true,
      deleted_user_id: userId,
      deleted_rows: cleanup.deleted_rows || 0,
      deleted_storage_objects: storageObjects,
      message: "Compte, données liées, médias Storage et compte Auth supprimés.",
    }, req)
  } catch (error) {
    console.error("delete-account:", error)
    return json({
      ok: false,
      error: error instanceof Error ? error.message : "Erreur serveur.",
    }, 500, req)
  }
})
