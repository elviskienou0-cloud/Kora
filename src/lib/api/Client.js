const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"
const TOKEN_KEY = "kora.auth.token"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function request(path, { method = "GET", body, headers = {}, skipAuth = false } = {}) {
  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  }

  if (!skipAuth) {
    const token = getToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Token expiré ou invalide -> on déconnecte proprement
  if (res.status === 401 && !skipAuth) {
    setToken(null)
    window.location.href = "/login"
    throw new ApiError("Session expirée", 401)
  }

  const isJson = res.headers.get("content-type")?.includes("application/json")
  const data = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const message = data?.message || `Erreur ${res.status}`
    throw new ApiError(message, res.status, data)
  }

  return data
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
}