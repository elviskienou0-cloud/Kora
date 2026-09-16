import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext.jsx"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils.js"

const VALID_ROLES = ["client", "manager", "admin"]

export default function RoleGuard({ allowedRoles = [], children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
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

  // Aucun utilisateur authentifié
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Vérifie que les rôles demandés par la route sont eux-mêmes valides
  const safeAllowedRoles = allowedRoles.filter((role) =>
    VALID_ROLES.includes(role)
  )

  // Le rôle réel de l'utilisateur doit être valide
  if (!VALID_ROLES.includes(user.role)) {
    return <Navigate to="/home" replace />
  }

  // L'utilisateur n'a pas le rôle autorisé
  if (!safeAllowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />
  }

  return children ?? <Outlet />
}