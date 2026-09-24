import { supabase } from "@/lib/supabase"

export const TALENT_PROFILE_MEDIA_BUCKET = "talent-profile-media"

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

    const { data } = supabase.storage
      .from(TALENT_PROFILE_MEDIA_BUCKET)
      .getPublicUrl(path)

    if (!data?.publicUrl) {
      throw new Error(
        `Impossible de récupérer l'URL de ${field}.`
      )
    }

    result[field] = data.publicUrl
  }

  return result
}