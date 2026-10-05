import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405)

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
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
      return json({ error: "Configuration Supabase Edge Function manquante." }, 500)
    }

    const authHeader = req.headers.get("Authorization") || ""
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim()
    if (!accessToken) return json({ error: "Authorization manquante." }, 401)

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: authData, error: authError } =
      await callerClient.auth.getUser(accessToken)

    if (authError || !authData?.user) {
      return json({ error: "Session invalide ou expirée." }, 401)
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
    if (!profile) return json({ error: "Profil utilisateur introuvable." }, 404)

    const role = String(profile.role || "").trim().toLowerCase()
    if (role === "admin" || role === "superadmin") {
      return json({
        error: "La suppression d'un compte administrateur doit passer par le processus administrateur sécurisé.",
      }, 403)
    }

    const storageObjects = await removeUserStorage(adminClient, userId)

    const { data: cleanup, error: cleanupError } =
      await adminClient.rpc("delete_my_account_v2")

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
    })
  } catch (error) {
    console.error("delete-account:", error)
    return json({
      ok: false,
      error: error instanceof Error ? error.message : "Erreur serveur.",
    }, 500)
  }
})
