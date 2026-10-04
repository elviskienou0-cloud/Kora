import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/AuthContext.jsx"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils.js"
import { supabase, isAuthError } from "@/lib/supabase"

const VALID_ROLES = ["client", "manager", "admin", "superadmin"]

const INITIAL_SUBSCRIPTION_CHECK = {
  loading: false,
  expired: false,
  error: null,
}

export default function RoleGuard({ allowedRoles = [], children }) {
  const {
    user,
    session,
    isLoading,
    handleInvalidSession,
  } = useAuth()
  const location = useLocation()
  const [subscriptionCheck, setSubscriptionCheck] = useState(INITIAL_SUBSCRIPTION_CHECK)

  useEffect(() => {
    let cancelled = false

    async function checkManagerSubscription() {
      const currentRole = String(user?.role || "").trim().toLowerCase()
      const path = location.pathname

      if (!user || !session || currentRole !== "manager" || path === "/manager/subscription" || path === "/subscription-expired") {
        setSubscriptionCheck(INITIAL_SUBSCRIPTION_CHECK)
        return
      }

      setSubscriptionCheck({ loading: true, expired: false, error: null })

      try {
        const { data, error } = await supabase.rpc("get_my_subscription")

        if (error) {
          if (isAuthError(error)) {
            if (!cancelled) {
              setSubscriptionCheck(INITIAL_SUBSCRIPTION_CHECK)
            }
            await handleInvalidSession("invalid")
            return
          }
          throw error
        }

        const sub = Array.isArray(data) ? data[0] : data
        const active = ["trialing", "active"].includes(String(sub?.status || "").toLowerCase())
        const end = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : 0
        const expired = !active || !end || end <= Date.now()

        if (!cancelled) {
          setSubscriptionCheck({ loading: false, expired, error: null })
        }
      } catch (error) {
        console.error("KORA subscription guard:", error)

        // Fail closed: une erreur de vérification ne doit jamais donner
        // implicitement accès aux fonctionnalités réservées aux abonnés actifs.
        if (!cancelled) {
          setSubscriptionCheck({
            loading: false,
            expired: false,
            error: "Impossible de vérifier votre abonnement. Réessayez.",
          })
        }
      }
    }

    checkManagerSubscription()
    return () => { cancelled = true }
  }, [
    user?.authId,
    user?.role,
    session?.access_token,
    location.pathname,
    handleInvalidSession,
  ])

  if (isLoading || subscriptionCheck.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className={cn("h-10 w-10 text-gold animate-spin")}
            aria-label="Vérification"
          />
          <p className="text-sm text-muted-foreground">
            Vérification...
          </p>
        </div>
      </div>
    )
  }

  if (subscriptionCheck.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Vérification de l'abonnement</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {subscriptionCheck.error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // Un manager expiré est maintenu sur la page de réabonnement.
  if (user?.role === "manager" && subscriptionCheck.expired && location.pathname !== "/subscription-expired") {
    return <Navigate to="/subscription-expired" replace />
  }

  // Aucun utilisateur authentifié
  if (!user || !session) {
    return <Navigate to="/login" replace />
  }

  const safeAllowedRoles = allowedRoles
    .map((role) => String(role || "").trim().toLowerCase())
    .filter((role) => VALID_ROLES.includes(role))

  const currentRole = String(user.role || "").trim().toLowerCase()

  if (!VALID_ROLES.includes(currentRole)) {
    return <Navigate to="/home" replace />
  }

  if (!safeAllowedRoles.includes(currentRole)) {
    if (currentRole === "superadmin") return <Navigate to="/superadmin" replace />
    if (currentRole === "admin") return <Navigate to="/admin" replace />
    if (currentRole === "manager") return <Navigate to="/manager/dashboard" replace />
    return <Navigate to="/client/dashboard" replace />
  }

  return children ?? <Outlet />
}