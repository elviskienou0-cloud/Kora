import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext.jsx"
import { supabase } from "@/lib/supabase"

const ROLE_DASHBOARDS = {
  client: "/client/dashboard",
  manager: "/manager/dashboard",
  admin: "/admin",
  superadmin: "/superadmin",
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, authStatus, isLoading, refreshProfile } = useAuth()
  const [callbackError, setCallbackError] = useState("")
  const [processing, setProcessing] = useState(false)
  const startedRef = useRef(false)

  const params = new URLSearchParams(window.location.search)
  const authError =
    params.get("error_description") ||
    params.get("error") ||
    params.get("error_code")

  useEffect(() => {
    if (
      authError ||
      isLoading ||
      authStatus !== "AUTHENTICATED" ||
      !user ||
      startedRef.current
    ) {
      return
    }

    startedRef.current = true
    async function finalizeAuthentication() {
      setProcessing(true)
      setCallbackError("")

      try {
        // Only the authenticated invitee can activate their own confirmed
        // pending invitation. Ordinary account confirmations return accepted=false.
        const { data, error } = await supabase.rpc("accept_my_admin_invitation")
        if (error) throw error

        if (data?.expired) {
          throw new Error(
            "Cette invitation administrateur a expiré. Contactez le Super Admin de KORA."
          )
        }

        const currentUser = data?.accepted
          ? await refreshProfile()
          : user

        const destination =
          ROLE_DASHBOARDS[String(currentUser.role || "").toLowerCase()]

        if (!destination) {
          throw new Error("Votre profil KORA ne possède aucun rôle autorisé.")
        }

        navigate(destination, { replace: true })
      } catch (error) {
        setCallbackError(
          error?.message ||
            "Impossible de finaliser la confirmation de votre compte KORA."
        )
        setProcessing(false)
      }
    }

    void finalizeAuthentication()
  }, [authError, authStatus, isLoading, user, navigate, refreshProfile])

  const failed =
    Boolean(authError) ||
    Boolean(callbackError) ||
    (!isLoading &&
      authStatus !== "AUTHENTICATED" &&
      authStatus !== "INITIALIZING")

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 kora-public-shell kora-auth-page">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {failed ? (
          <>
            <h1 className="text-xl font-bold">Confirmation non finalisée</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {authError ||
                callbackError ||
                "Le lien est peut-être expiré ou déjà utilisé. Vous pouvez vous connecter ou demander un nouveau lien."}
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
            <h1 className="text-xl font-bold">
              {processing ? "Activation de votre accès" : "Confirmation réussie"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nous vérifions votre confirmation et préparons votre espace KORA.
            </p>
          </>
        )}
      </section>
    </main>
  )
}
