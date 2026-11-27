import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CheckCircle2, Clock3, CreditCard, Crown, Loader2, ShieldCheck, Upload, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"
import { getSasPayCheckoutUrl } from "@/lib/saspayCheckout"

const PENDING_PAYMENT_KEY = "kora_pending_saspay_payment"

function readPendingPayment() {
  try {
    const value = JSON.parse(sessionStorage.getItem(PENDING_PAYMENT_KEY) || "null")
    return value && typeof value.paymentId === "string" ? value : null
  } catch {
    return null
  }
}

function formatMoney(value, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

const FEATURE_EN = {
  "Création et consultation du profil talent": "Create and view talent profiles",
  "Galerie et portfolio du talent": "Talent gallery and portfolio",
  "Gestion du cachet": "Fee management",
  "Profil manager": "Manager profile",
  "Messagerie": "Messaging",
  "Gestion de plusieurs talents": "Manage multiple talents",
  "Gestion des demandes": "Request management",
  "Notifications": "Notifications",
  "Tableau de bord simplifié": "Basic dashboard",
  "Gestion des projets": "Project management",
  "Organisation du portefeuille de talents": "Talent portfolio organisation",
  "Tableau de bord analytique avancé": "Advanced analytics dashboard",
  "Statistiques détaillées": "Detailed statistics",
  "Analyse des performances des talents": "Talent performance analysis",
  "Collaboration sur les analyses et rapports": "Collaboration on analytics and reports",
  "Invitation de collaborateurs dans KORA": "Invite collaborators inside KORA",
  "Gestion des membres de l'équipe": "Team member management",
  "Permissions d'accès aux analyses et rapports": "Permissions for analytics and reports",
  "Modification et révocation des accès": "Edit and revoke access",
  "Génération de rapports d'activité": "Activity reports",
  "Export des données en PDF": "PDF data export",
  "Export des données en Excel (.xlsx)": "Excel workbook export (.xlsx)",
}

const PLAN_RESTRICTIONS = {
  FREE: {
    fr: ["Pas de gestion des demandes", "Pas de gestion des projets", "Pas de statistiques avancées", "Pas de gestion d'équipe"],
    en: ["No request management", "No project management", "No advanced statistics", "No team management"],
  },
  PRO: {
    fr: ["Trois talents maximum", "Pas de gestion collaborative", "Pas de permissions d'équipe", "Pas de tableau de bord analytique avancé", "Pas de statistiques détaillées", "Pas de rapports ni d'exports"],
    en: ["Three talents maximum", "No team collaboration", "No team permissions", "No advanced analytics dashboard", "No detailed statistics", "No reports or exports"],
  },
  BUSINESS: { fr: [], en: [] },
};

function getPlanDetails(plan, language) {
  const features = Array.isArray(plan?.features) ? plan.features : []
  return features
    .filter((feature) => typeof feature === "string")
    .map((feature) => language === "en" ? FEATURE_EN[feature] || feature : feature)
}

function formatDate(value, language = "fr") {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(language === "en" ? "en-GB" : "fr-FR", { dateStyle: "long" })
}

export default function ManagerSubscription() {
  const { t, language } = useI18n()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const autoCheckoutStarted = useRef(false)
  const requestPaymentRef = useRef(null)
  const managerId = user?.authId || user?.id

  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [nowMs, setNowMs] = useState(Date.now())
  const [pendingPayment, setPendingPayment] = useState(readPendingPayment)
  const [proofFiles, setProofFiles] = useState({})
  const [uploadingProofId, setUploadingProofId] = useState(null)

  const load = async () => {
    if (!managerId) return
    setLoading(true)
    try {
      const [{ data: planRows, error: plansError }, { data: subRows, error: subError }, { data: paymentRows, error: paymentsError }] = await Promise.all([
        supabase.from("plans").select("id, name, price, currency, duration_months, talent_limit, features, trial_days, annual_discount_pct, is_active").eq("is_active", true).order("price"),
        supabase.rpc("get_my_subscription"),
        supabase.from("payments").select("id, reference, provider, amount, currency, billing_cycle, status, proof_url, paid_at, created_at").eq("user_id", managerId).order("created_at", { ascending: false }).limit(20),
      ])
      if (plansError) throw plansError
      if (subError) throw subError
      if (paymentsError) throw paymentsError
      setPlans((planRows || []).filter((p) => ["FREE", "PRO", "BUSINESS"].includes(String(p.id).toUpperCase())))
      setSubscription(subRows?.[0] || null)
      setPayments(paymentRows || [])
    } catch (error) {
      console.error("Erreur abonnement :", error)
      toast.error(error?.message || "Impossible de charger l'abonnement.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [managerId])

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const currentPlanId = String(subscription?.plan_id || subscription?.plan || "FREE").toUpperCase()
  const currentIsActive = ["trialing", "active"].includes(subscription?.status)
  const expiresAt = subscription?.status === "trialing"
    ? subscription?.trial_end || subscription?.current_period_end
    : subscription?.current_period_end || subscription?.trial_end
  const isExpired = subscription?.status === "expired" || Boolean(
    expiresAt && new Date(expiresAt).getTime() <= nowMs
  )
  const remainingMs = expiresAt ? Math.max(0, new Date(expiresAt).getTime() - nowMs) : null
  const remainingDays = remainingMs === null ? null : Math.floor(remainingMs / 86_400_000)
  const remainingHours = remainingMs === null ? null : Math.floor((remainingMs % 86_400_000) / 3_600_000)
  const remainingMinutes = remainingMs === null ? null : Math.floor((remainingMs % 3_600_000) / 60_000)
  const countdownText = remainingMs === null ? null : language === "en"
    ? `${remainingDays}d ${remainingHours}h ${remainingMinutes}m remaining`
    : `${remainingDays} j ${remainingHours} h ${remainingMinutes} min restantes`
  const freeTrialExpired =
    String(subscription?.plan_id || subscription?.plan || "").toUpperCase() === "FREE" && isExpired

  const activateFree = async () => {
    setLoadingPlan("FREE")
    try {
      const { error } = await supabase.rpc("activate_free_plan")
      if (error) throw error
      toast.success(t("manager.useFree"))
      await load()
    } catch (error) {
      toast.error(error?.message || t("errors.generic"))
    } finally {
      setLoadingPlan(null)
    }
  }

  const requestPayment = async (plan) => {
    if (!managerId || !plan) return
    const planId = String(plan.id).toUpperCase()
    if (planId === "FREE") return activateFree()
    if (!["PRO", "BUSINESS"].includes(planId)) return

    setLoadingPlan(plan.id)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error("Session de connexion introuvable.")

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(supabaseUrl + "/functions/v1/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ plan_id: planId, billing_cycle: "monthly" }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Impossible d'initialiser le paiement.")

      const checkoutUrl = getSasPayCheckoutUrl(payload)
      const pending = {
        paymentId: String(payload.payment_id || ""),
        reference: String(payload.reference || ""),
        planId,
        confirmed: false,
        createdAt: new Date().toISOString(),
      }
      if (!pending.paymentId) throw new Error("Référence de paiement KORA manquante.")
      sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pending))
      setPendingPayment(pending)
      window.location.assign(checkoutUrl)
      return
    } catch (error) {
      console.error("Erreur initialisation paiement :", error)
      toast.error(error?.message || t("errors.generic"))
    } finally {
      setLoadingPlan(null)
    }
  }

  requestPaymentRef.current = requestPayment

  useEffect(() => {
    const planId = String(searchParams.get("checkout") || "").toUpperCase()
    if (!managerId || loading || !plans.length || !["PRO", "BUSINESS"].includes(planId) || autoCheckoutStarted.current) return

    const selectedPlan = plans.find((plan) => String(plan.id).toUpperCase() === planId)
    autoCheckoutStarted.current = true
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete("checkout")
    setSearchParams(nextParams, { replace: true })

    if (!selectedPlan) {
      toast.error(t("manager.paymentPlanUnavailable"))
      return
    }

    void requestPaymentRef.current?.(selectedPlan)
  }, [managerId, loading, plans, searchParams, setSearchParams, t])

  useEffect(() => {
    if (!pendingPayment?.paymentId || !payments.length) return
    const latest = payments.find((payment) => String(payment.id) === pendingPayment.paymentId)
    if (latest && ["paid", "failed", "cancelled"].includes(String(latest.status).toLowerCase())) {
      sessionStorage.removeItem(PENDING_PAYMENT_KEY)
      setPendingPayment(null)
    }
  }, [payments, pendingPayment?.paymentId])

  const uploadPaymentProof = async (payment) => {
    const file = proofFiles[payment.id]
    if (!managerId || !payment?.id || !file) {
      toast.error(language === "en" ? "Choose a proof file first." : "Choisissez d'abord une capture.")
      return
    }

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])
    if (!allowedTypes.has(file.type)) {
      toast.error(language === "en" ? "Use a JPG, PNG, WebP or PDF file." : "Utilisez un fichier JPG, PNG, WebP ou PDF.")
      return
    }
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      toast.error(language === "en" ? "The file must not exceed 5 MB." : "Le fichier ne doit pas dépasser 5 Mo.")
      return
    }

    setUploadingProofId(payment.id)
    let uploadedPath = ""
    try {
      const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-90) || "preuve.png"
      const fileName = `${Date.now()}-${safeName}`.slice(0, 120)
      uploadedPath = `${managerId}/${payment.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(uploadedPath, file, { upsert: false, contentType: file.type })
      if (uploadError) throw uploadError

      const { error: attachError } = await supabase.rpc("attach_payment_proof", {
        p_payment_id: payment.id,
        p_path: uploadedPath,
      })
      if (attachError) {
        await supabase.storage.from("payment-proofs").remove([uploadedPath])
        uploadedPath = ""
        throw attachError
      }

      setProofFiles((current) => {
        const next = { ...current }
        delete next[payment.id]
        return next
      })

      if (pendingPayment?.paymentId === payment.id) {
        const confirmed = { ...pendingPayment, confirmed: true, declaredAt: new Date().toISOString() }
        sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(confirmed))
        setPendingPayment(confirmed)
      }

      toast.success(language === "en"
        ? "Proof sent. Your payment is awaiting manual administrator validation."
        : "Preuve envoyée. Votre paiement attend la validation manuelle d'un administrateur.")
      await load()
    } catch (error) {
      console.error("Erreur envoi preuve paiement :", error)
      toast.error(error?.message || (language === "en" ? "Unable to send the proof." : "Impossible d'envoyer la preuve."))
    } finally {
      setUploadingProofId(null)
    }
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{t("account.manager")}</p>
          <h1 className="text-2xl font-black tracking-tight">{t("subscriptions.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("manager.choosePlan")} </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 border-gold/30 bg-gold/10 text-gold-dark">
          <Crown className="h-3.5 w-3.5" />
          {subscription?.plan_name || (currentPlanId === "BUSINESS" ? "Business" : currentPlanId === "PRO" ? "Pro" : "Gratuit")}
        </Badge>
      </div>

      {pendingPayment && (
        <Card className={pendingPayment.confirmed ? "border-primary/25 bg-primary/5" : "border-border bg-muted/30"}>
          <CardContent className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-black">
                  {pendingPayment.confirmed ? t("manager.paymentAwaitingValidation") : t("manager.paymentReturnTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pendingPayment.confirmed
                    ? (language === "en" ? "Proof received. An administrator will verify it manually." : "Preuve reçue. Un administrateur la vérifiera manuellement.")
                    : (language === "en" ? "After payment, upload your screenshot from the payment history below. Your subscription will activate only after administrator validation." : "Après le paiement, envoyez votre capture depuis l'historique ci-dessous. Votre abonnement sera activé uniquement après validation par un administrateur.")}
                </p>
                {pendingPayment.reference && (
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">
                    {t("manager.paymentReference")}: {pendingPayment.reference}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {subscription?.status === "pending" && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-black">{t("subscriptions.pending")}</p>
              <p className="text-sm text-muted-foreground">{t("manager.paymentRecorded")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isExpired && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-black">{t("subscriptions.expired")}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Expired on" : "Expiré le"} {formatDate(expiresAt, language)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {language === "en"
                    ? "Your information and talents are retained. Choose a paid plan below to renew access after payment validation."
                    : "Vos informations et vos talents sont conservés. Choisissez un forfait payant ci-dessous pour renouveler votre accès après validation du paiement."}
                </p>
              </div>
            </div>
            <Button
              className="shrink-0 gap-2"
              onClick={() => document.getElementById("kora-subscription-plans")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <CreditCard className="h-4 w-4" />
              {t("subscriptions.renew")}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentIsActive && expiresAt && countdownText && remainingMs > 0 && (
        <Card className="border-gold/30 bg-gold/5">
          <CardContent className="p-5 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-gold" />
            <div>
              <p className="font-black">{language === "en" ? "Subscription time remaining" : "Temps restant sur l’abonnement"}</p>
              <p className="text-sm text-muted-foreground">{countdownText}</p>
              <p className="text-xs text-muted-foreground">{language === "en" ? "Access is automatically restricted at expiry." : "Les accès sont automatiquement limités à l’expiration."}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div id="kora-subscription-plans" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const id = String(plan.id).toUpperCase()
          const isCurrent = currentPlanId === id && currentIsActive
          const isExpiredFree = id === "FREE" && freeTrialExpired
          const price = Number(plan.price || 0)
          const buttonLabel = isCurrent
            ? t("manager.activePlan")
            : isExpired && id !== "FREE"
              ? t("subscriptions.renew")
              : isExpiredFree
                ? t("manager.trialEnded")
                : id === "FREE"
                  ? t("manager.useFree")
                  : t("manager.choosePlanButton", { name: plan.name })

          return (
            <Card key={plan.id} className={`h-full border-border/60 ${isCurrent ? "border-gold/50 shadow-xl shadow-gold/10" : ""}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="font-black">{plan.name}</CardTitle>
                    <CardDescription>
                      {id === "FREE"
                        ? (language === "en" ? "30-day free trial" : "30 jours d'essai offerts")
                        : (language === "en" ? "30 days" : "30 jours")}
                    </CardDescription>
                  </div>
                  {isCurrent && <Badge className="bg-gold/10 text-gold-dark border-gold/30">{t("subscriptions.active")}</Badge>}
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black gold-text-gradient">{formatMoney(price, plan.currency)}</span>
                    {price > 0 && <span className="text-xs font-bold text-muted-foreground">{t("manager.perMonth")}</span>}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2.5">
                  {getPlanDetails(plan, language).map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {PLAN_RESTRICTIONS[id]?.[language === "en" ? "en" : "fr"]?.length > 0 && (
                  <div className="space-y-2 border-t border-border/70 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {language === "en" ? "Restrictions" : "Restrictions"}
                    </p>
                    {PLAN_RESTRICTIONS[id][language === "en" ? "en" : "fr"].map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full gap-2"
                  disabled={isCurrent || isExpiredFree || loadingPlan === plan.id}
                  onClick={() => requestPayment(plan)}
                >
                  {loadingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {buttonLabel}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-black flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-gold" /> {t("manager.paymentHistory")}</CardTitle>
          <CardDescription>{t("manager.saspayPending")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30 text-left">
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">{t("payments.reference")}</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">{t("payments.provider")}</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">{t("payments.amount")}</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">{t("payments.status")}</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">{language === "en" ? "Proof" : "Preuve"}</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">{t("payments.date")}</th>
              </tr></thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">{t("common.noData")}</td></tr>
                ) : payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border/40">
                    <td className="px-6 py-3.5 font-medium">{payment.reference}</td>
                    <td className="px-6 py-3.5">{payment.provider}</td>
                    <td className="px-6 py-3.5 font-black">{formatMoney(payment.amount, payment.currency)}</td>
                    <td className="px-6 py-3.5"><Badge variant="outline">{payment.status}</Badge></td>
                    <td className="px-6 py-3.5">
                      {payment.proof_url ? (
                        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">{language === "en" ? "Sent" : "Envoyée"}</Badge>
                      ) : payment.status === "pending" ? (
                        <div className="min-w-[220px] space-y-2">
                          <input
                            key={proofFiles[payment.id]?.name || payment.id}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            aria-label={language === "en" ? "Choose payment proof" : "Choisir la preuve de paiement"}
                            onChange={(event) => setProofFiles((current) => ({ ...current, [payment.id]: event.target.files?.[0] || null }))}
                            className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1.5 file:text-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => uploadPaymentProof(payment)}
                            disabled={!proofFiles[payment.id] || uploadingProofId === payment.id}
                            className="gap-1.5"
                          >
                            {uploadingProofId === payment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                            {language === "en" ? "Send proof" : "Envoyer la preuve"}
                          </Button>
                          <p className="text-[10px] text-muted-foreground">{language === "en" ? "JPG, PNG, WebP or PDF · 5 MB max" : "JPG, PNG, WebP ou PDF · 5 Mo max"}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">{formatDate(payment.created_at, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
