import { supabase } from "@/lib/supabase"

export const TALENT_PORTFOLIO_BUCKET = "talent-portfolio"

export function getPortfolioTypeFromMime(mime = "") {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime === "application/pdf") return "document"
  return "file"
}

export function getPortfolioTypeFromUrl(url = "") {
  try {
    const pathname = new URL(url).pathname.toLowerCase()

    if (/\.(png|jpe?g|webp|gif|avif)$/.test(pathname)) {
      return "image"
    }

    if (/\.(mp4|webm|mov|m4v|ogg)$/.test(pathname)) {
      return "video"
    }
  } catch {
    // Keep link as default when the URL cannot be parsed locally.
  }

  return "link"
}

export async function uploadTalentPortfolioFiles(talentId, files = []) {
  const selected = (files || []).filter(Boolean)

  if (!talentId || selected.length === 0) {
    return []
  }

  const createdRows = []

  for (const file of selected) {
    const cleanName = String(file.name || "fichier")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120)

    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
    const path = `${talentId}/${id}-${cleanName}`

    const { error: uploadError } = await supabase.storage
      .from(TALENT_PORTFOLIO_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      throw new Error(
        `Upload impossible pour ${file.name}: ${uploadError.message}`
      )
    }

    const payload = {
      talent_id: talentId,
      title: cleanName,
      description: "",
      type: getPortfolioTypeFromMime(file.type),
      // On stocke temporairement le chemin.
      // Detail le remplace par une URL signée.
      url: path,
      storage_path: path,
      mime_type: file.type || null,
      created_at: new Date().toISOString(),
    }

    const { data: row, error: rowError } = await supabase
      .from("portfolio_items")
      .insert(payload)
      .select(
        "id, talent_id, title, description, type, url, storage_path, mime_type, created_at"
      )
      .single()

    if (rowError) {
      await supabase.storage
        .from(TALENT_PORTFOLIO_BUCKET)
        .remove([path])

      throw rowError
    }

    createdRows.push(row)
  }

  return createdRows
}

export async function addTalentPortfolioLinks(talentId, links = []) {
  const normalized = (links || [])
    .map((item) => ({
      title:
        String(item.title || "Lien portfolio").trim() ||
        "Lien portfolio",
      url: String(item.url || "").trim(),
    }))
    .filter((item) => item.url)

  if (!talentId || normalized.length === 0) {
    return []
  }

  const payload = normalized.map((item) => ({
    talent_id: talentId,
    title: item.title,
    description: "",
    type: "link",
    url: item.url,
    storage_path: null,
    mime_type: null,
    created_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from("portfolio_items")
    .insert(payload)
    .select(
      "id, talent_id, title, description, type, url, storage_path, mime_type, created_at"
    )

  if (error) {
    throw error
  }

  return data || []
}

export async function deleteTalentPortfolioItems(talentId) {
  if (!talentId) {
    return
  }

  const { data: rows, error: loadError } = await supabase
    .from("portfolio_items")
    .select("id, storage_path")
    .eq("talent_id", talentId)

  if (loadError) {
    throw loadError
  }

  const storagePaths = (rows || [])
    .map((row) => row.storage_path)
    .filter(Boolean)

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(TALENT_PORTFOLIO_BUCKET)
      .remove(storagePaths)

    if (storageError) {
      console.warn(
        "Nettoyage Storage du portfolio incomplet :",
        storageError
      )
    }
  }

  const { error: deleteError } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("talent_id", talentId)

  if (deleteError) {
    throw deleteError
  }
}

export async function resolvePortfolioUrls(items = []) {
  return Promise.all(
    (items || []).map(async (item) => {
      if (!item?.storage_path) {
        return item
      }

      const { data, error } = await supabase.storage
        .from(TALENT_PORTFOLIO_BUCKET)
        .createSignedUrl(item.storage_path, 3600)

      if (error) {
        console.warn(
          "Impossible de générer l'URL du portfolio :",
          error
        )

        return item
      }

      return {
        ...item,
        url: data?.signedUrl || item.url || null,
      }
    })
  )
}