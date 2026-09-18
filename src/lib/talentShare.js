export function buildTalentShareUrl(talentId) {
  if (!talentId) {
    return window.location.origin
  }

  return `${window.location.origin}/talent/${talentId}`
}

export async function copyTalentShareLink(url) {
  if (!url) {
    throw new Error("Lien de partage manquant")
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return true
  }

  const textarea = document.createElement("textarea")

  textarea.value = url
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"

  document.body.appendChild(textarea)

  textarea.focus()
  textarea.select()

  const copied = document.execCommand("copy")

  textarea.remove()

  if (!copied) {
    throw new Error("Impossible de copier le lien")
  }

  return true
}

export function getTalentShareTargets({
  url,
  title,
  text,
}) {
  const encodedUrl = encodeURIComponent(url)

  const encodedText = encodeURIComponent(
    text ||
      title ||
      "Découvrez ce talent sur KORA"
  )

  return {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,

    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,

    x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,

    title,
  }
}