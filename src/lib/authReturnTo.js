const STORAGE_KEY = "kora.auth.returnTo"

export function setReturnTo(path) {
  if (typeof window === "undefined") return
  if (!path) return
  try {
    sessionStorage.setItem(STORAGE_KEY, path)
  } catch (_) {
    /* ignore */
  }
}

export function getReturnTo(defaultPath = "/home") {
  if (typeof window === "undefined") return defaultPath
  try {
    const p = sessionStorage.getItem(STORAGE_KEY)
    if (p) {
      sessionStorage.removeItem(STORAGE_KEY)
      return p
    }
    return defaultPath
  } catch (_) {
    return defaultPath
  }
}
