import { useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext.jsx"
import { setReturnTo } from "@/lib/authReturnTo.js"

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return
    }

    const returnTo = `${location.pathname}${location.search}${location.hash}`
    setReturnTo(returnTo)
  }, [
    isAuthenticated,
    isLoading,
    location.pathname,
    location.search,
    location.hash,
  ])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">
          Chargement...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children ?? <Outlet />
}