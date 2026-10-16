import { supabase } from "@/lib/supabase"

export const TALENT_PROFILE_MEDIA_BUCKET = "talent-profile-media"

export const TALENT_PROFILE_MEDIA_SCHEME = "storage://talent-profile-media/"

function extractTalentMediaPath(value) {
  if (typeof value !== "string" || !value.trim()) return null
  if (value.startsWith(TALENT_PROFILE_MEDIA_SCHEME)) {
    return value.slice(TALENT_PROFILE_MEDIA_SCHEME.length)
  }

  try {
    const pathname = new URL(value).pathname
    const match = pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/talent-profile-media\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

/**
 * Resolve a stored media reference to a short-lived signed URL.
 * Supports legacy public URLs already stored in talent_profiles and the
 * storage:// references written by the private-bucket upload flow.
 */
export async function resolveTalentProfileMediaUrl(value, expiresIn = 3600) {
  const path = extractTalentMediaPath(value)
  if (!path) return value || null

  const { data, error } = await supabase.storage
    .from(TALENT_PROFILE_MEDIA_BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.warn("Impossible de signer le média du talent :", error.message)
    return null
  }
  return data?.signedUrl || null
}

export async function resolveTalentProfileMedia(talent) {
  if (!talent) return talent
  const [avatar_url, cover_url] = await Promise.all([
    resolveTalentProfileMediaUrl(talent.avatar_url),
    resolveTalentProfileMediaUrl(talent.cover_url),
  ])
  return { ...talent, avatar_url, cover_url }
}

function safeName(name = "image") {
  return String(name || "image")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
}

function generateUniqueId() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export async function uploadTalentProfileMedia(
  managerId,
  talentId,
  files = {}
) {
  if (!managerId || !talentId) {
    throw new Error("Talent ou manager introuvable.")
  }

  const result = {
    avatar_url: null,
    cover_url: null,
  }

  const mediaFiles = {
    avatar_url: files.avatar,
    cover_url: files.cover,
  }

  for (const [field, file] of Object.entries(mediaFiles)) {
    if (!file) continue

    if (!String(file.type || "").startsWith("image/")) {
      throw new Error(
        "La photo de profil et la photo de couverture doivent être des images."
      )
    }

    // Limite de sécurité : 5 Mo par image
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        "Chaque image doit faire moins de 5 Mo."
      )
    }

    const extension =
      safeName(file.name).split(".").pop() || "jpg"

    const uniqueId = generateUniqueId()

    const path =
      `${managerId}/${talentId}/${field}-${uniqueId}.${extension}`

    const { error } = await supabase.storage
      .from(TALENT_PROFILE_MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      })

    if (error) {
      throw new Error(
        `Upload impossible pour ${field} : ${error.message}`
      )
    }

    // Persist a stable storage reference, never a short-lived signed URL.
    result[field] = `${TALENT_PROFILE_MEDIA_SCHEME}${path}`
  }

  return result
}