import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext.jsx"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils.js"

export default function RoleGuard({ allowedRoles, children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn("h-10 w-10 text-gold animate-spin")} />
          <p className="text-sm text-muted-foreground">Vérification...</p>
        </div>
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />
  }

  return children ? children : <Outlet />
}
