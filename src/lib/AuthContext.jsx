import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"

import { supabase } from "@/lib/supabase"

const AuthContext = createContext(null)

const PUBLIC_ROLES = ["client", "manager"]

const ALL_ROLES = [
  "client",
  "manager",
  "admin",
  "superadmin",
]

function isValidRole(role) {
  return ALL_ROLES.includes(
    String(role || "").trim().toLowerCase()
  )
}

function normalizeProfile(profile) {
  if (!profile) return null

  const normalizedRole = String(profile.role || "")
    .trim()
    .toLowerCase()

  if (!isValidRole(normalizedRole)) {
    console.error("Rôle KORA invalide :", profile.role)
    return null
  }

  return {
    ...profile,
    role: normalizedRole,
  }
}

function getAuthErrorMessage(error, action = "login") {
  const message = String(error?.message || "").trim()
  const lower = message.toLowerCase()
  const code = String(error?.code || "").trim().toLowerCase()
  const status = Number(error?.status || 0)

  if (
    code === "invalid_credentials" ||
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return action === "register"
      ? "Impossible de créer ce compte avec ces identifiants. Vérifiez l'adresse email et réessayez."
      : "Email ou mot de passe incorrect. Si vous avez oublié votre mot de passe, utilisez « Mot de passe oublié ? »."
  }

  if (
    code === "email_not_confirmed" ||
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed")
  ) {
    return "Votre adresse email n'est pas encore confirmée. Vérifiez votre boîte mail ou utilisez le renvoi de confirmation."
  }

  if (
    code === "user_banned" ||
    lower.includes("user is banned") ||
    lower.includes("banned")
  ) {
    return "Ce compte est temporairement bloqué. Contactez l'administration KORA."
  }

  if (
    code === "over_request_rate_limit" ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return "Trop de tentatives. Attendez quelques minutes avant de réessayer."
  }

  if (
    code === "weak_password" ||
    lower.includes("password should be at least") ||
    lower.includes("password is too weak")
  ) {
    return "Le mot de passe est trop faible. Utilisez au moins 6 caractères."
  }

  if (
    code === "signup_disabled" ||
    lower.includes("signups not allowed") ||
    lower.includes("signup is disabled")
  ) {
    return "Les inscriptions sont temporairement désactivées sur KORA."
  }

  if (
    code === "email_provider_disabled" ||
    lower.includes("email provider")
  ) {
    return "La connexion par email est temporairement indisponible. Vérifiez la configuration Supabase."
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error")
  ) {
    return "Impossible de joindre Supabase. Vérifiez votre connexion internet puis réessayez."
  }

  if (
    lower.includes("apikey") ||
    lower.includes("api key") ||
    lower.includes("jwt")
  ) {
    return "La configuration de la connexion Supabase est incorrecte. Vérifiez les variables VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY."
  }

  if (action === "register" && status === 422) {
    return "Les informations d'inscription sont invalides. Vérifiez l'email et les informations saisies."
  }

  if (!message) {
    return action === "register"
      ? "Impossible de créer le compte. Vérifiez les informations saisies puis réessayez."
      : "Connexion impossible. Vérifiez votre connexion internet et la configuration Supabase."
  }

  return message
}

/**
 * Version publique de la traduction des erreurs Auth.
 * Peut être utilisée par d'autres composants de KORA.
 */
export function describeAuthError(error) {
  return getAuthErrorMessage(error, "login")
}

async function fetchProfile(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("Erreur chargement profil KORA :", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })

    throw new Error(
      "Impossible de charger votre profil KORA. Vérifiez les règles d'accès Supabase."
    )
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

  const login = useCallback(async ({ email, password }) => {
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase()

    if (!cleanEmail || !password) {
      throw new Error(
        "Veuillez renseigner votre email et votre mot de passe."
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error(
        "Veuillez saisir une adresse email valide."
      )
    }

    if (password.length < 6) {
      throw new Error(
        "Le mot de passe doit contenir au moins 6 caractères."
      )
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

    if (error) {
      console.error(
        "KORA Supabase signInWithPassword :",
        {
          message: error.message,
          status: error.status,
          code: error.code,
        }
      )

      throw new Error(
        getAuthErrorMessage(error, "login")
      )
    }

    if (!data?.user) {
      throw new Error(
        "Supabase n'a retourné aucun utilisateur après la connexion."
      )
    }

    try {
      const profile = await fetchProfile(data.user.id)

      if (!profile) {
        await supabase.auth.signOut()

        throw new Error(
          "Connexion réussie, mais votre profil KORA est introuvable ou votre rôle n'est pas autorisé."
        )
      }

      const fullUser = buildUser(profile, data.user)

      if (!fullUser) {
        await supabase.auth.signOut()

        throw new Error(
          "Impossible de finaliser votre session KORA."
        )
      }

      setUser(fullUser)

      return fullUser
    } catch (error) {
      if (error?.message?.includes("profil KORA")) {
        throw error
      }

      console.error(
        "Erreur finalisation connexion KORA :",
        error
      )

      await supabase.auth.signOut()

      throw new Error(
        error?.message ||
          "Connexion réussie, mais impossible de charger votre profil KORA."
      )
    }
  }, [])

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

      if (!PUBLIC_ROLES.includes(normalizedRole)) {
        throw new Error(
          "Type de compte invalide. Choisissez Client ou Manager."
        )
      }

      const cleanEmail = String(email || "")
        .trim()
        .toLowerCase()

      const cleanFirstName = String(firstName || "").trim()
      const cleanLastName = String(lastName || "").trim()

      if (!cleanEmail || !password) {
        throw new Error(
          "L'email et le mot de passe sont obligatoires."
        )
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanEmail
        )
      ) {
        throw new Error(
          "Veuillez saisir une adresse email valide."
        )
      }

      if (password.length < 6) {
        throw new Error(
          "Le mot de passe doit contenir au moins 6 caractères."
        )
      }

      if (!cleanFirstName || !cleanLastName) {
        throw new Error(
          "Le prénom et le nom sont obligatoires."
        )
      }

      const name =
        `${cleanFirstName} ${cleanLastName}`.trim()

      const { data, error } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name,
              first_name: cleanFirstName,
              last_name: cleanLastName,
              role: normalizedRole,
            },
          },
        })

      if (error) {
        console.error("KORA Supabase signUp :", {
          message: error.message,
          status: error.status,
          code: error.code,
        })

        throw new Error(
          getAuthErrorMessage(error, "register")
        )
      }

      if (!data?.user) {
        throw new Error(
          "Supabase n'a retourné aucun utilisateur après l'inscription."
        )
      }

      if (!data.session) {
        return {
          pendingEmailConfirmation: true,
          email: cleanEmail,
        }
      }

      let profile = null

      for (let attempt = 0; attempt < 5; attempt += 1) {
        profile = await fetchProfile(data.user.id)

        if (profile) {
          break
        }

        await new Promise((resolve) => {
          setTimeout(resolve, 250)
        })
      }

      if (!profile) {
        await supabase.auth.signOut()

        throw new Error(
          "Votre compte a été créé, mais votre profil KORA n'a pas pu être créé automatiquement. Vérifiez le trigger Supabase on_auth_user_created."
        )
      }

      if (!PUBLIC_ROLES.includes(profile.role)) {
        await supabase.auth.signOut()

        throw new Error(
          "Le rôle du compte est invalide. Contactez l'administration KORA."
        )
      }

      const fullUser = buildUser(
        profile,
        data.user
      )

      if (!fullUser) {
        await supabase.auth.signOut()

        throw new Error(
          "Impossible de finaliser votre session KORA."
        )
      }

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

      const { data, error } = await supabase
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

    async function loadSession(session) {
      if (!mounted) return

      if (!session?.user) {
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
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
          buildUser(profile, session.user)
        )
      } catch (error) {
        console.error(
          "Erreur synchronisation profil KORA :",
          error
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

    async function initializeAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        await loadSession(session)
      } catch (error) {
        console.error(
          "Erreur initialisation authentification KORA :",
          error?.message || error
        )

        if (mounted) {
          setUser(null)
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

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          setTimeout(() => {
            void loadSession(session)
          }, 0)
        }
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