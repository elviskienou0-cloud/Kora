import { useCallback, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle2, Clock3, CreditCard, FileCheck2, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"

function money(amount, currency = "XOF") {
  try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount || 0)) }
  catch { return `${Number(amount || 0).toLocaleString("fr-FR")} ${currency}` }
}

export default function PaymentTracking() {
  const { user } = useAuth()
  const { language } = useI18n()
  const en = language === "en"
  const [params] = useSearchParams()
  const paymentId = params.get("payment")
  const managerId = user?.authId || user?.id
  const [payment, setPayment] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!managerId) return
    setLoading(true)
    setError("")
    try {
      let query = supabase.from("payments")
        .select("id, reference, plan_id, amount, currency, status, proof_url, paid_at, created_at, updated_at")
        .eq("user_id", managerId)
        .order("created_at", { ascending: false })
        .limit(1)
      if (paymentId) query = supabase.from("payments")
        .select("id, reference, plan_id, amount, currency, status, proof_url, paid_at, created_at, updated_at")
        .eq("user_id", managerId)
        .eq("id", paymentId)
        .limit(1)
      const [{ data: rows, error: paymentError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
        query,
        supabase.rpc("get_my_subscription"),
      ])
      if (paymentError) throw paymentError
      if (subscriptionError) throw subscriptionError
      setPayment(rows?.[0] || null)
      setSubscription(subscriptions?.[0] || null)
    } catch (err) {
      setError(err?.message || (en ? "Unable to load payment tracking." : "Impossible de charger le suivi du paiement."))
    } finally {
      setLoading(false)
    }
  }, [managerId, paymentId, en])

  useEffect(() => { load() }, [load])

  const status = String(payment?.status || "").toLowerCase()
  const paid = status === "paid"
  const failed = ["failed", "cancelled"].includes(status)
  const active = ["active", "trialing"].includes(String(subscription?.status || "").toLowerCase()) &&
    String(subscription?.plan_id || subscription?.plan || "").toUpperCase() === String(payment?.plan_id || "").toUpperCase()
  const steps = [
    { title: en ? "Plan selected" : "Abonnement choisi", description: payment ? (en ? `Plan ${payment.plan_id}` : `Formule ${payment.plan_id}`) : (en ? "Choose a plan to start." : "Choisissez une formule pour commencer."), done: Boolean(payment), Icon: CreditCard },
    { title: en ? "Payment initiated" : "Paiement initié", description: payment ? (en ? "Your KORA payment record has been created." : "Votre demande de paiement est enregistrée par KORA.") : (en ? "No payment has been initiated." : "Aucun paiement n'a encore été initié."), done: Boolean(payment), Icon: Clock3 },
    { title: en ? "Proof submitted" : "Preuve transmise", description: payment?.proof_url ? (en ? "Your payment proof has been received for review." : "Votre preuve de paiement a été transmise pour vérification.") : (en ? "After payment, return to your subscription page and upload your proof." : "Après le paiement, revenez sur votre page Abonnement pour transmettre votre preuve."), done: Boolean(payment?.proof_url), Icon: FileCheck2 },
    { title: en ? "Administrator validation" : "Validation administrative", description: paid ? (en ? "KORA has validated the payment." : "KORA a validé le paiement.") : failed ? (en ? "The payment was not approved." : "Le paiement n'a pas été validé.") : (en ? "An administrator must verify the submitted proof." : "Un administrateur doit vérifier la preuve transmise."), done: paid, failed, Icon: ShieldCheck },
    { title: en ? "Subscription activated" : "Abonnement activé", description: active ? (en ? "Your plan is active." : "Votre formule est active.") : (en ? "Activation happens only after administrator validation." : "L'activation intervient uniquement après validation administrative."), done: active, Icon: CheckCircle2 },
  ]

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold"/></div>

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-gold">{en ? "SUBSCRIPTION" : "ABONNEMENT"}</p><h1 className="mt-2 text-2xl font-black">{en ? "Payment tracking" : "Suivi de votre abonnement"}</h1><p className="mt-1 text-sm text-muted-foreground">{en ? "Follow each real step until your plan is activated." : "Suivez chaque étape réelle jusqu'à l'activation de votre formule."}</p></div>
        <Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4"/>{en ? "Refresh" : "Actualiser"}</Button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {!payment ? (
        <Card><CardContent className="p-7 text-center"><CreditCard className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/><p className="font-semibold">{en ? "No payment found." : "Aucun paiement trouvé."}</p><p className="mt-1 text-sm text-muted-foreground">{en ? "Choose a plan to begin your subscription." : "Choisissez une formule pour démarrer votre abonnement."}</p><Button asChild className="mt-5"><Link to="/manager/subscription">{en ? "View plans" : "Voir les abonnements"}</Link></Button></CardContent></Card>
      ) : (
        <>
          <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>{payment.plan_id} · {money(payment.amount, payment.currency)}</CardTitle><CardDescription>{en ? "Payment reference" : "Référence de paiement"} : {payment.reference || payment.id}</CardDescription></div><Badge variant="outline" className={paid ? "border-emerald-500/40 text-emerald-700" : failed ? "border-destructive/40 text-destructive" : "border-amber-500/40 text-amber-700"}>{payment.status}</Badge></div></CardHeader></Card>
          <Card>
            <CardHeader><CardTitle>{en ? "Your progress" : "Progression de votre souscription"}</CardTitle><CardDescription>{en ? "Statuses are read from your KORA payment and subscription records." : "Les statuts proviennent des enregistrements réels de paiement et d'abonnement KORA."}</CardDescription></CardHeader>
            <CardContent><ol className="space-y-5">{steps.map((step, index) => {
              const Icon = step.Icon
              return <li key={step.title} className="flex gap-4">
                <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border ${step.done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : step.failed ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-muted text-muted-foreground"}`}>{step.done ? <CheckCircle2 size={19}/> : <Icon size={19}/>}</span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{index + 1}. {step.title}</h3>{step.done && <Badge variant="outline" className="text-emerald-700">{en ? "Completed" : "Terminé"}</Badge>}{step.failed && <Badge variant="destructive">{en ? "Not approved" : "Non validé"}</Badge>}</div><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p></div>
              </li>
            })}</ol></CardContent>
          </Card>
          {!payment.proof_url && !paid && <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800">{en ? "Your payment proof is still missing. Upload it from your subscription page so an administrator can review it." : "Votre preuve de paiement manque encore. Transmettez-la depuis votre page Abonnement afin qu'un administrateur puisse la vérifier."}</div>}
          <div className="flex flex-wrap gap-3"><Button asChild><Link to="/manager/subscription">{en ? "Open my subscription" : "Ouvrir mon abonnement"}</Link></Button><Button asChild variant="outline"><Link to="/manager/dashboard">{en ? "Back to dashboard" : "Retour au tableau de bord"}</Link></Button></div>
        </>
      )}
    </div>
  )
}
