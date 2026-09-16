import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext.jsx"
import { setReturnTo } from "@/lib/authReturnTo.js"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils.js"

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className={cn("h-10 w-10 text-gold animate-spin")}
            aria-label="Chargement"
          />
          <p className="text-sm text-muted-foreground">
            Chargement...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`

    setReturnTo(returnTo)

    return <Navigate to="/login" replace />
  }

  return children ?? <Outlet />
}