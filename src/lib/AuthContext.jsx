import { createContext, useContext, useEffect, useState, useCallback } from "react"

const AuthContext = createContext(null)

const STORAGE_KEY = "kora.auth.user"

const MOCK_USERS = [
  {
    id: "u1",
    email: "admin@kora.africa",
    password: "admin123",
    name: "Admin Kora",
    role: "admin",
    avatar: null,
  },
  {
    id: "u2",
    email: "manager@kora.africa",
    password: "manager123",
    name: "Manager Kora",
    role: "manager",
    avatar: null,
  },
  {
    id: "u3",
    email: "client@kora.africa",
    password: "client123",
    name: "Client Kora",
    role: "client",
    avatar: null,
  },
  {
    id: "u4",
    email: "talent@kora.africa",
    password: "talent123",
    name: "Talent Kora",
    role: "talent",
    avatar: null,
  },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setUser(parsed)
      }
    } catch (_) {
      /* ignore */
    } finally {
      setIsLoading(false)
    }
  }, [])

  const persist = useCallback((u) => {
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setUser(u)
  }, [])

  const login = useCallback(async ({ email, password }) => {
    await new Promise((r) => setTimeout(r, 600))
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) {
      throw new Error("Identifiants incorrects")
    }
    const { password: _p, ...safe } = found
    persist(safe)
    return safe
  }, [persist])

  const register = useCallback(async (data) => {
    await new Promise((r) => setTimeout(r, 600))
    const role = data.role || "client"
    const newUser = {
      id: "u_" + Math.random().toString(36).slice(2, 8),
      email: data.email,
      name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.email,
      role,
      avatar: null,
    }
    persist(newUser)
    return newUser
  }, [persist])

  const logout = useCallback(() => {
    persist(null)
  }, [persist])

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
