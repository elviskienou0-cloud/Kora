import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, LockKeyhole, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"

const ACCESS_FIELDS = {
  requests: "can_manage_requests",
  notifications: "can_view_notifications",
}

export default function ManagerFeatureGate({ feature, children }) {
  const { user } = useAuth()
  const { language } = useI18n()
  const navigate = useNavigate()
  const [state, setState] = useState({
    loading: true,
    allowed: false,
    error: "",
    planId: null,
  })

  useEffect(() => {
    let active = true
    const field = ACCESS_FIELDS[feature]

    async function checkAccess() {
      if (!field || !user?.authId || user.role !== "manager") {
        if (active) setState({ loading: false, allowed: false, error: "", planId: null })
        return
      }

      setState((current) => ({ ...current, loading: true, error: "" }))
      const { data, error } = await supabase.rpc("get_my_manager_plan_access")

      if (!active) return
      if (error) {
        setState({
          loading: false,
          allowed: false,
          error: error.message || (language === "en" ? "Unable to verify your plan." : "Impossible de vérifier votre formule."),
          planId: null,
        })
        return
      }

      setState({
        loading: false,
        allowed: Boolean(data?.active && data?.[field]),
        error: "",
        planId: data?.plan_id || null,
      })
    }

    void checkAccess()
    return () => { active = false }
  }, [feature, user?.authId, user?.role, language])

  if (state.loading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-gold" />
      </div>
    )
  }

  if (state.error) {
    return (
      <Card className="mx-auto max-w-xl border-destructive/30">
        <CardContent className="space-y-4 p-6 text-center">
          <p className="font-semibold">{language === "en" ? "Plan verification" : "Vérification de l’abonnement"}</p>
          <p className="text-sm text-muted-foreground">{state.error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {language === "en" ? "Try again" : "Réessayer"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!state.allowed) {
    const requiredPlan = feature === "requests" || feature === "notifications" ? "PRO" : "BUSINESS"
    return (
      <Card className="mx-auto max-w-xl border-gold/25">
        <CardContent className="space-y-4 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
            <LockKeyhole className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {language === "en" ? "Feature reserved for a higher plan" : "Fonctionnalité réservée à une formule supérieure"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === "en"
                ? `This feature is available from the ${requiredPlan} plan. Your current plan is ${state.planId || "unavailable"}.`
                : `Cette fonctionnalité est disponible à partir du plan ${requiredPlan}. Votre formule actuelle : ${state.planId || "indisponible"}.`}
            </p>
          </div>
          <Button onClick={() => navigate("/manager/subscription")}>
            {language === "en" ? "View plans" : "Voir les abonnements"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return children
}
