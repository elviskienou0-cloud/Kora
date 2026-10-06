import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock3, CreditCard, Crown, Loader2, LogOut, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"

function money(value, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export default function SubscriptionExpired() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from("plans")
        .select("id,name,price,currency,duration_months,talent_limit,features,is_active")
        .in("id", ["PRO", "BUSINESS"])
        .eq("is_active", true)
        .order("price")

      if (error) {
        console.error("KORA expired subscription plans:", error)
        toast.error("Impossible de charger les abonnements.")
      } else if (!cancelled) {
        setPlans(data || [])
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const subscribe = async (plan) => {
    setPaying(plan.id)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) throw new Error("Session de connexion introuvable.")

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(supabaseUrl + "/functions/v1/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ plan_id: plan.id, billing_cycle: "monthly" }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Impossible d'initialiser le paiement.")

      if (payload.checkout_url) {
        window.location.href = payload.checkout_url
        return
      }

      toast.success("Paiement enregistré. Il doit maintenant être validé par KORA.")
    } catch (error) {
      console.error("KORA expired subscription payment:", error)
      toast.error(error?.message || "Impossible d'initialiser le paiement.")
    } finally {
      setPaying(null)
    }
  }

  const signOut = async () => {
    try {
      await logout()
      navigate("/login", { replace: true })
    } catch (error) {
      toast.error(error?.message || "Impossible de se déconnecter.")
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gold-gradient shadow-lg shadow-gold/20">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-black text-xl">KORA</p>
              <p className="text-xs text-muted-foreground">{t("subscriptions.title")}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />{t("account.logout")}</Button>
        </div>

        <Card className="mb-8 overflow-hidden border-gold/30 shadow-xl shadow-gold/5">
          <CardHeader className="bg-gold/5 p-7">
            <Badge className="mb-3 w-fit gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700">
              <Clock3 className="h-3.5 w-3.5" /> Abonnement expiré
            </Badge>
            <CardTitle className="text-3xl font-black">{t("subscriptions.expired")}</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Votre accès manager est temporairement suspendu. Réabonnez-vous pour retrouver vos talents, demandes, projets et outils KORA.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-7">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/20 p-4"><p className="font-bold">{t("common.private")}</p><p className="mt-1 text-sm text-muted-foreground">{t("errors.unauthorized")}</p></div>
              <div className="rounded-xl border bg-muted/20 p-4"><p className="font-bold">{t("common.saved")}</p><p className="mt-1 text-sm text-muted-foreground">{t("manager.retainedData")}</p></div>
              <div className="rounded-xl border bg-muted/20 p-4"><p className="font-bold">{t("subscriptions.renew")}</p><p className="mt-1 text-sm text-muted-foreground">{t("common.success")}</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          {plans.map((plan) => {
            const id = String(plan.id).toUpperCase()
            const business = id === "BUSINESS"
            return (
              <Card key={plan.id} className="border-border/60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-black">{plan.name}</CardTitle>
                    {business && <Badge className="bg-gold/10 text-gold-dark">{t("common.available")}</Badge>}
                  </div>
                  <CardDescription>{business ? t("manager.expiredMulti") : t("manager.expiredThree")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="text-3xl font-black gold-text-gradient">{money(plan.price, plan.currency)} <span className="text-sm text-muted-foreground">/ mois</span></div>
                  <Separator />
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ {business ? "Talents illimités" : "Jusqu'à 3 talents"}</p>
                    <p>✓ {t("manager.projectManagementFeatures")}</p>
                    <p>✓ {t("manager.managerTools")}</p>
                    <p>✓ {t("manager.saspayValidation")}</p>
                  </div>
                  <Button className="w-full gold-gradient text-primary-foreground" disabled={paying === plan.id} onClick={() => subscribe(plan)}>
                    {paying === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    {paying === plan.id ? t("manager.preparing") : t("manager.resubscribe")}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Réactivation après validation du paiement par KORA.
        </div>
      </div>
    </div>
  )
}
