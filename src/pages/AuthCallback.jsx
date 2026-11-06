import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext.jsx"

const ROLE_DASHBOARDS = {
  client: "/client/dashboard",
  manager: "/manager/dashboard",
  admin: "/admin",
  superadmin: "/superadmin",
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, authStatus, isLoading } = useAuth()

  const params = new URLSearchParams(window.location.search)
  const authError =
    params.get("error_description") ||
    params.get("error") ||
    params.get("error_code")

  useEffect(() => {
    if (authError || isLoading || authStatus !== "AUTHENTICATED" || !user) {
      return
    }

    const destination = ROLE_DASHBOARDS[String(user.role || "").toLowerCase()]
    if (destination) {
      navigate(destination, { replace: true })
    } else {
      navigate("/login", { replace: true })
    }
  }, [authError, authStatus, isLoading, user, navigate])

  const failed =
    Boolean(authError) ||
    (!isLoading && authStatus !== "AUTHENTICATED" && authStatus !== "INITIALIZING")

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {failed ? (
          <>
            <h1 className="text-xl font-bold">Confirmation non finalisée</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {authError
                ? decodeURIComponent(String(authError).replace(/\+/g, " "))
                : "Le lien est peut-être expiré ou déjà utilisé. Vous pouvez vous connecter ou demander un nouveau lien."}
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
            >
              Aller à la connexion
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <h1 className="text-xl font-bold">Confirmation réussie</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nous préparons votre espace KORA. Vous allez être redirigé automatiquement.
            </p>
          </>
        )}
      </section>
    </main>
  )
}
