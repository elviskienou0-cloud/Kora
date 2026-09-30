import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"

import { supabase } from "@/lib/supabase"

const AuthContext = createContext(null)

// Rôles pouvant être utilisés lors de l'inscription publique
const PUBLIC_ROLES = ["client", "manager"]

// Tous les rôles reconnus par KORA
const ALL_ROLES = [
  "client",
  "manager",
  "admin",
  "superadmin",
]

function isValidRole(role) {
  return ALL_ROLES.includes(role)
}

function normalizeProfile(profile) {
  if (!profile) return null

  if (!isValidRole(profile.role)) {
    console.error("Rôle KORA invalide :", profile.role)
    return null
  }

  return profile
}

async function fetchProfile(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error(
      "Erreur chargement profil :",
      error.message
    )
    return null
  }

  return normalizeProfile(data)
}

function buildUser(profile, authUser) {
  if (!profile || !authUser) return null

  return {
    ...profile,
    authId: authUser.id,
    email: authUser.email || profile.email || "",
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = useCallback(
    async ({ email, password }) => {
      const cleanEmail = String(email || "")
        .trim()
        .toLowerCase()

      if (!cleanEmail || !password) {
        throw new Error(
          "Veuillez renseigner votre email et votre mot de passe."
        )
      }

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

      if (error) {
        throw new Error(
          error.message === "Invalid login credentials"
            ? "Identifiants incorrects."
            : error.message
        )
      }

      if (!data?.user) {
        throw new Error("Utilisateur introuvable.")
      }

      const profile = await fetchProfile(data.user.id)

      if (!profile) {
        await supabase.auth.signOut()

        throw new Error(
          "Votre profil KORA est introuvable ou votre rôle n'est pas autorisé."
        )
      }

      const fullUser = buildUser(
        profile,
        data.user
      )

      setUser(fullUser)

      return fullUser
    },
    []
  )

  const register = useCallback(
    async ({
      email,
      password,
      firstName,
      lastName,
      role,
    }) => {
      const normalizedRole = String(role || "")
        .trim()
        .toLowerCase()

      // Seuls client et manager peuvent créer
      // leur compte publiquement.
      if (!PUBLIC_ROLES.includes(normalizedRole)) {
        throw new Error(
          "Type de compte invalide. Choisissez Client ou Manager."
        )
      }

      const cleanEmail = String(email || "")
        .trim()
        .toLowerCase()

      if (!cleanEmail || !password) {
        throw new Error(
          "L'email et le mot de passe sont obligatoires."
        )
      }

      const name =
        `${firstName || ""} ${lastName || ""}`.trim() ||
        cleanEmail

      const { data, error } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name,
              first_name: firstName || "",
              last_name: lastName || "",
              role: normalizedRole,
            },
          },
        })

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.user) {
        throw new Error(
          "Impossible de créer le compte."
        )
      }

      if (!data.session) {
        return {
          pendingEmailConfirmation: true,
          email: cleanEmail,
        }
      }

      const profile = await fetchProfile(
        data.user.id
      )

      if (!profile) {
        await supabase.auth.signOut()

        throw new Error(
          "Le compte a été créé mais son profil KORA est introuvable."
        )
      }

      const fullUser = buildUser(
        profile,
        data.user
      )

      setUser(fullUser)

      return fullUser
    },
    []
  )

  const logout = useCallback(async () => {
    const { error } =
      await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }

    setUser(null)
  }, [])

  const updateUser = useCallback(
    async (patch = {}) => {
      if (!user?.authId) {
        throw new Error("Utilisateur non connecté.")
      }

      const {
        role,
        id,
        authId,
        created_at,
        updated_at,
        ...safePatch
      } = patch

      const { data, error } =
        await supabase
          .from("profiles")
          .update(safePatch)
          .eq("id", user.authId)
          .select("*")
          .single()

      if (error) {
        throw new Error(error.message)
      }

      const normalizedProfile =
        normalizeProfile(data)

      if (!normalizedProfile) {
        throw new Error(
          "Le profil retourné contient un rôle invalide."
        )
      }

      const updatedUser = {
        ...normalizedProfile,
        authId: user.authId,
        email: user.email || "",
      }

      setUser(updatedUser)

      return updatedUser
    },
    [user]
  )

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!mounted) return

        if (!session?.user) {
          setUser(null)
          return
        }

        const profile = await fetchProfile(
          session.user.id
        )

        if (!mounted) return

        if (!profile) {
          await supabase.auth.signOut()
          setUser(null)
          return
        }

        setUser(
          buildUser(
            profile,
            session.user
          )
        )
      } catch (error) {
        console.error(
          "Erreur initialisation authentification :",
          error.message
        )

        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return

        if (
          event === "SIGNED_OUT" ||
          !session?.user
        ) {
          setUser(null)
          setIsLoading(false)
          return
        }

        setTimeout(async () => {
          if (!mounted) return

          try {
            const profile =
              await fetchProfile(
                session.user.id
              )

            if (!mounted) return

            if (!profile) {
              setUser(null)
              return
            }

            setUser(
              buildUser(
                profile,
                session.user
              )
            )
          } catch (error) {
            console.error(
              "Erreur synchronisation profil :",
              error.message
            )

            if (mounted) {
              setUser(null)
            }
          } finally {
            if (mounted) {
              setIsLoading(false)
            }
          }
        }, 0)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    )
  }

  return context
}

