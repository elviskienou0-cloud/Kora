import { supabase } from "@/lib/supabase"

export const PROFILE_MEDIA_BUCKET = "profile-media"

function safeName(name = "image") {
  return String(name || "image")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
}

function uniqueId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export async function uploadProfileImage(userId, file, kind) {
  if (!userId) throw new Error("Connexion requise.")
  if (!file) throw new Error("Image introuvable.")
  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("Le fichier doit être une image.")
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Chaque image doit faire moins de 5 Mo.")
  }
  if (!["avatar", "cover"].includes(kind)) {
    throw new Error("Type d'image invalide.")
  }

  const extension = safeName(file.name).split(".").pop() || "jpg"
  const path = `${userId}/${kind}-${uniqueId()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    })

  if (uploadError) throw new Error(`Upload impossible : ${uploadError.message}`)

  const { data } = supabase.storage.from(PROFILE_MEDIA_BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error("Impossible de récupérer l'URL de l'image.")

  const patch = kind === "avatar" ? { avatar: data.publicUrl } : { cover_url: data.publicUrl }
  const { error: profileError } = await supabase.from("profiles").update(patch).eq("id", userId)

  if (profileError) throw new Error(`Image envoyée mais profil non mis à jour : ${profileError.message}`)

  return data.publicUrl
}
