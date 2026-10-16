export const LANGUAGE_STORAGE_KEY = "kora-language"
export const ANONYMOUS_LANGUAGE_STORAGE_KEY = `${LANGUAGE_STORAGE_KEY}:anonymous`

export function isSupportedLanguage(value) {
  return value === "fr" || value === "en"
}

export function normalizeLanguage(value) {
  return value === "en" ? "en" : "fr"
}

export function getLanguageStorageKey(userId) {
  return userId
    ? `${LANGUAGE_STORAGE_KEY}:user:${userId}`
    : ANONYMOUS_LANGUAGE_STORAGE_KEY
}

/**
 * Reads only the selected account's preference. The legacy global value is
 * used solely for signed-out visitors during migration from the old setting.
 */
export function readStoredLanguage(storage, userId = null) {
  if (!storage || typeof storage.getItem !== "function") return null

  try {
    const scoped = storage.getItem(getLanguageStorageKey(userId))
    if (isSupportedLanguage(scoped)) return scoped

    if (!userId) {
      const legacy = storage.getItem(LANGUAGE_STORAGE_KEY)
      if (isSupportedLanguage(legacy)) return legacy
    }
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }

  return null
}
