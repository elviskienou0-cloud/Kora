export const STORAGE_KEY = "kora-language"

export function normalizeLanguage(value) {
  return value === "en" ? "en" : "fr"
}

export function resolveInitialLanguage(savedLanguage) {
  return savedLanguage === "fr" || savedLanguage === "en"
    ? savedLanguage
    : "fr"
}

export function persistLanguage(value, storage) {
  const normalized = normalizeLanguage(value)
  let target = storage

  if (target === undefined) {
    try {
      target = typeof window !== "undefined" ? window.localStorage : null
    } catch {
      target = null
    }
  }

  try {
    target?.setItem(STORAGE_KEY, normalized)
  } catch {
    // Storage can be unavailable in private/restricted browser contexts.
  }

  return normalized
}
