import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock3, CreditCard, Crown, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"

function formatMoney(value, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function getPlanDetails(plan) {
  const name = String(plan?.name || "").toLowerCase()
  if (name === "essai") return [
    "30 jours gratuits",
    "1 talent maximum",
    "Outils professionnels",
    "Gestion du profil talent",
    "Portfolio et compétences",
    "Gestion des demandes",
    "Visibilité sur KORA selon le workflow de publication",
    "Pas de transactions KORA",
    "0 % de commission",
  ]
  if (name === "pro") return [
    "3 talents maximum",
    "Outils professionnels",
    "Gestion des profils",
    "Portfolio et compétences",
    "Gestion des demandes et projets",
    "Fonctionnalités professionnelles KORA",
    "Pas de paiement de transactions via KORA",
    "0 % de commission sur les transactions KORA",
  ]
  if (name === "business") return [
    "Talents illimités",
    "Tous les outils professionnels",
    "Transactions directement via KORA",
    "Paiement des projets via KORA",
    "Suivi des transactions",
    "5 % de commission uniquement sur les transactions réalisées via KORA",
    "95 % du montant de la transaction revient au manager/talent",
  ]
  return []
}

function formatDate(value) {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR")
}

export default function ManagerSubscription() {
  const { user } = useAuth()
  const managerId = user?.authId || user?.id

  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(null)

  const load = async () => {
    if (!managerId) return
    setLoading(true)

    try {
      const [{ data: planRows, error: plansError }, { data: subRows, error: subError }, { data: paymentRows, error: paymentsError }] = await Promise.all([
        supabase.from("plans").select("id, name, price, currency, duration_months, talent_limit, features, trial_days, annual_discount_pct, is_active").eq("is_active", true).order("price"),
        supabase.rpc("get_my_subscription"),
        supabase.from("payments").select("id, reference, provider, amount, currency, billing_cycle, status, paid_at, created_at").eq("user_id", managerId).order("created_at", { ascending: false }).limit(20),
      ])

      if (plansError) throw plansError
      if (subError) throw subError
      if (paymentsError) throw paymentsError

      setPlans(planRows || [])
      setSubscription(subRows?.[0] || null)
      setPayments(paymentRows || [])
    } catch (error) {
      console.error("Erreur abonnement :", error)
      toast.error(error?.message || "Impossible de charger l'abonnement.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [managerId])

  const currentPlanId = subscription?.plan_id || "FREE"

  const activateBusiness = async (plan) => {
    if (!managerId || !plan) return
    setLoadingPlan(plan.id)
    try {
      const { error } = await supabase.rpc("activate_business_plan")
      if (error) throw error
      toast.success("Plan Business activé.")
      await load()
    } catch (error) {
      toast.error(error?.message || "Impossible d'activer Business.")
    } finally {
      setLoadingPlan(null)
    }
  }

  const requestPayment = async (plan) => {
    if (!managerId || !plan) return
    if (plan.name === "Business") return activateBusiness(plan)
    if (plan.price <= 0) {
      toast.info("Ce plan est gratuit.")
      return
    }
    setLoadingPlan(plan.id)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error("Session de connexion introuvable.")
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(supabaseUrl + "/functions/v1/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ plan_id: plan.id, billing_cycle: "monthly", provider: import.meta.env.VITE_PAYMENT_PROVIDER || "unconfigured" }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Impossible d'initialiser le paiement.")
      if (payload.checkout_url) { window.location.href = payload.checkout_url; return }
      toast.success("Paiement créé. Attendez la confirmation du prestataire.")
      await load()
    } catch (error) {
      console.error("Erreur initialisation paiement :", error)
      toast.error(error?.message || "Impossible d'initialiser le paiement.")
    } finally { setLoadingPlan(null) }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Compte manager</p>
          <h1 className="text-2xl font-black tracking-tight">Abonnement & facturation</h1>
          <p className="text-sm text-muted-foreground">Les plans, prix et droits sont pilotés par Supabase.</p>
        </div>

        <Badge variant="outline" className="w-fit gap-1.5 border-gold/30 bg-gold/10 text-gold-dark">
          <Crown className="h-3.5 w-3.5" />
          {subscription?.plan_name || "Free"}
        </Badge>
      </div>

      {subscription?.status === "trialing" && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <p className="font-black">Votre période d'essai est active</p>
              <p className="text-sm text-muted-foreground">Début : {formatDate(subscription.trial_start)} · Fin : {formatDate(subscription.trial_end)}</p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">Trial</Badge>
          </CardContent>
        </Card>
      )}

      {subscription?.status === "expired" && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-black">Votre période d'essai est terminée</p>
              <p className="text-sm text-muted-foreground">Choisissez un abonnement payant pour réactiver les fonctionnalités correspondantes.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const price = Number(plan.price || 0)
          const isCurrent = currentPlanId === plan.id && ["trialing", "active"].includes(subscription?.status)
          const features = Object.entries(plan.features || {}).filter(([, enabled]) => enabled).map(([key]) => key)

          return (
            <Card key={plan.id} className={`h-full border-border/60 ${isCurrent ? "border-gold/50 shadow-xl shadow-gold/10" : ""}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="font-black">{plan.name}</CardTitle>
                    <CardDescription>{plan.trial_days > 0 ? `${plan.trial_days} jours d'essai` : "Sans période d'essai"}</CardDescription>
                  </div>
                  {isCurrent && <Badge className="bg-gold/10 text-gold-dark border-gold/30">Actif</Badge>}
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black gold-text-gradient">{formatMoney(price, plan.currency)}</span>
                    <span className="text-xs font-bold text-muted-foreground">/ mois</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-bold">Limite talents : {plan.talent_limit == null ? "Illimitée" : plan.talent_limit}</div>
                  {getPlanDetails(plan).map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {feature.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>

                <Button className="w-full gap-2" disabled={isCurrent || loadingPlan === plan.id} onClick={() => requestPayment(plan)}>
                  {loadingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {isCurrent ? "Forfait actif" : plan.name === "Business" ? "Activer Business" : plan.price === 0 ? "Plan gratuit" : `Choisir ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-black flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-gold" /> Historique des paiements</CardTitle>
          <CardDescription>Uniquement les paiements enregistrés par KORA.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">Référence</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">Prestataire</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">Montant</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">Aucun paiement enregistré.</td></tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/40">
                      <td className="px-6 py-3.5 font-medium">{payment.reference}</td>
                      <td className="px-6 py-3.5">{payment.provider}</td>
                      <td className="px-6 py-3.5 font-black">{formatMoney(payment.amount, payment.currency)}</td>
                      <td className="px-6 py-3.5"><Badge variant="outline">{payment.status}</Badge></td>
                      <td className="px-6 py-3.5 text-muted-foreground">{formatDate(payment.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
