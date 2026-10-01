import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/AuthContext.jsx"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils.js"
import { supabase } from "@/lib/supabase"

const VALID_ROLES = ["client", "manager", "admin", "superadmin"]

export default function RoleGuard({ allowedRoles = [], children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const [subscriptionCheck, setSubscriptionCheck] = useState({ loading: false, expired: false })

  useEffect(() => {
    let cancelled = false

    async function checkManagerSubscription() {
      const currentRole = String(user?.role || "").trim().toLowerCase()
      const path = location.pathname

      if (!user || currentRole !== "manager" || path === "/manager/subscription" || path === "/subscription-expired") {
        setSubscriptionCheck({ loading: false, expired: false })
        return
      }

      setSubscriptionCheck({ loading: true, expired: false })

      try {
        const { data, error } = await supabase.rpc("get_my_subscription")
        if (error) throw error

        const sub = Array.isArray(data) ? data[0] : data
        const active = ["trialing", "active"].includes(String(sub?.status || "").toLowerCase())
        const end = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : 0
        const expired = !active || !end || end <= Date.now()

        if (!cancelled) setSubscriptionCheck({ loading: false, expired })
      } catch (error) {
        console.error("KORA subscription guard:", error)
        // En cas d'erreur de lecture, ne pas bloquer un utilisateur actif.
        if (!cancelled) setSubscriptionCheck({ loading: false, expired: false })
      }
    }

    checkManagerSubscription()
    return () => { cancelled = true }
  }, [user?.authId, user?.role, location.pathname])

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

  // Un manager expiré est maintenu sur la page de réabonnement.
  if (user?.role === "manager" && subscriptionCheck.expired && location.pathname !== "/subscription-expired") {
    return <Navigate to="/subscription-expired" replace />
  }

  // Aucun utilisateur authentifié
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Vérifie que les rôles demandés par la route sont eux-mêmes valides
  const safeAllowedRoles = allowedRoles
    .map((role) => String(role || "").trim().toLowerCase())
    .filter((role) => VALID_ROLES.includes(role))

  // Le rôle réel de l'utilisateur doit être valide
  const currentRole = String(user.role || "").trim().toLowerCase()

  if (!VALID_ROLES.includes(currentRole)) {
    return <Navigate to="/home" replace />
  }

  // L'utilisateur n'a pas le rôle autorisé
  if (!safeAllowedRoles.includes(currentRole)) {
    if (currentRole === "superadmin") return <Navigate to="/superadmin" replace />
    if (currentRole === "admin") return <Navigate to="/admin" replace />
    if (currentRole === "manager") return <Navigate to="/manager/dashboard" replace />
    return <Navigate to="/client/dashboard" replace />
  }

  return children ?? <Outlet />
}