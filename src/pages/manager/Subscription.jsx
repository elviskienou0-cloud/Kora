// @ts-nocheck
import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Crown, Sparkles, CheckCircle2, X, Zap, Shield, Star,
  ChevronRight, Users, Award, Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "5 000",
    period: "/ mois",
    tagline: "Idéal pour lancer",
    highlight: false,
    features: [
      { label: "Jusqu'à 10 talents managés", ok: true },
      { label: "Support par email", ok: true },
      { label: "Paiements sécurisés", ok: true },
      { label: "Analytics avancés", ok: false },
      { label: "Contrats & e-signatures", ok: false },
      { label: "API & webhooks", ok: false },
      { label: "Account manager dédié", ok: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "20 000",
    period: "/ mois",
    tagline: "Le plus populaire",
    highlight: true,
    features: [
      { label: "Tout le plan starter", ok: true },
      { label: "Support prioritaire 24h", ok: true },
      { label: "Paiements sécurisés", ok: true },
      { label: "Analytics avancés", ok: true },
      { label: "Contrats & e-signatures", ok: true },
      { label: "API & webhooks", ok: false },
      { label: "Account manager dédié", ok: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Sur mesure",
    period: "",
    tagline: "Pour les grandes équipes",
    highlight: false,
    features: [
      { label: "Talents illimités", ok: true },
      { label: "Projets illimités", ok: true },
      { label: "Support SLA 24/7", ok: true },
      { label: "Paiements sécurisés", ok: true },
      { label: "Analytics avancés + BI", ok: true },
      { label: "Contrats & e-signatures", ok: true },
      { label: "API & webhooks", ok: true },
      { label: "Account manager dédié", ok: true },
    ],
  },
]

const BILLING = [
  { id: "b1", label: "Forfait Pro — Mars 2025", amount: "-75 000 XOF", date: "01/03/2025", status: "paid" },
  { id: "b2", label: "Commission projet AgriTech", amount: "-54 000 XOF", date: "15/03/2025", status: "paid" },
  { id: "b3", label: "Crédit fidélité", amount: "+12 000 XOF", date: "10/03/2025", status: "credit" },
  { id: "b4", label: "Forfait Pro — Avril 2025", amount: "75 000 XOF", date: "01/04/2025", status: "pending" },
]

const CURRENT = "pro"

export default function ManagerSubscription() {
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState(null)

  const subscribe = async (plan) => {
    setLoading(plan.id)
    await new Promise((r) => setTimeout(r, 900))
    toast.success(`Abonnement ${plan.name} activé 🎉`)
    setLoading(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Abonnement & Facturation</h1>
          <p className="text-sm text-muted-foreground">Gérez votre forfait et vos paiements en toute sécurité.</p>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-gold/10 text-gold-dark border-gold/30 w-fit sm:w-auto font-bold">
          <Crown className="h-3.5 w-3.5" /> Plan actif : {PLANS.find((p) => p.id === CURRENT)?.name || "Pro"}
        </Badge>
      </div>

      <Card className="border-gold/25 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-md shadow-gold/25 shrink-0">
            <Sparkles className="h-7 w-7 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-lg mb-1">Passez à l'annuel · -10% offerts 🎁</h3>
            <p className="text-sm text-muted-foreground">Bénéficiez de 2 mois gratuits et de perks exclusifs en payant annuellement.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl">
              <button
                onClick={() => setYearly(false)}
                className={cn("px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all", !yearly ? "bg-background shadow" : "text-muted-foreground")}
              >
                Mensuel
              </button>
              <button
                onClick={() => setYearly(true)}
                className={cn("px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all", yearly ? "bg-background shadow" : "text-muted-foreground")}
              >
                Annuel <Badge className="ml-1 text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">-10%</Badge>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={cn(
              "h-full flex flex-col relative overflow-hidden transition-all",
              plan.highlight ? "border-gold/50 shadow-2xl shadow-gold/10 scale-[1.01]" : "border-border/60 hover:border-gold/30"
            )}>
              {plan.highlight && (
                <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
              )}
              {plan.highlight && (
                <div className="absolute top-4 right-4">
                  <Badge className="gap-1 bg-gold/15 text-gold-dark border-gold/30 font-bold px-2.5">
                    <Zap className="h-3 w-3" /> Populaire
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4 pt-6">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-3", plan.highlight ? "gold-gradient shadow-md shadow-gold/25" : "bg-muted")}>
                  {plan.id === "starter" && <Users className={cn("h-5 w-5", plan.highlight ? "text-primary-foreground" : "text-foreground")} />}
                  {plan.id === "pro" && <Award className={cn("h-5 w-5", plan.highlight ? "text-primary-foreground" : "text-foreground")} />}
                  {plan.id === "enterprise" && <Shield className={cn("h-5 w-5", plan.highlight ? "text-primary-foreground" : "text-foreground")} />}
                </div>
                <CardTitle className="font-black text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0 space-y-5">
                <div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <p className="text-4xl font-black tracking-tight gold-text-gradient">
                      {plan.price !== "Sur mesure" && yearly ? Math.round(parseInt(plan.price.replace(/\s/g, ""), 10) * 0.8 * 12).toLocaleString("fr-FR") : plan.price}
                    </p>
                    <span className="text-sm font-bold text-muted-foreground">{plan.price === "Sur mesure" ? "" : yearly ? " / an" : plan.period}</span>
                  </div>
                  {yearly && plan.price !== "Sur mesure" && (
                    <p className="text-[11px] text-emerald-600 font-bold">
                      Économisez {Math.round(parseInt(plan.price.replace(/\s/g, ""), 10) * 2.4).toLocaleString("fr-FR")} XOF / an
                    </p>
                  )}
                </div>
                <Separator />
                <ul className="space-y-2.5 text-sm flex-1">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        f.ok ? "bg-emerald-500/10" : "bg-muted"
                      )}>
                        {f.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className={cn("leading-tight", !f.ok && "text-muted-foreground line-through/60")}>{f.label}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2">
                  <Button
                    className={cn(
                      "w-full h-11 font-bold gap-2",
                      plan.highlight ? "gold-gradient text-white" : ""
                    )}
                    variant={plan.highlight ? "default" : CURRENT === plan.id ? "secondary" : "outline"}
                    disabled={CURRENT === plan.id || loading === plan.id}
                    onClick={() => subscribe(plan)}
                  >
                    {CURRENT === plan.id ? (
                      <><CheckCircle2 className="h-4 w-4" /> Forfait actif</>
                    ) : loading === plan.id ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-current/60 border-t-current animate-spin" /> Validation...</>
                    ) : (
                      <>Choisir {plan.name} <ChevronRight className="h-4 w-4" /></>
                    )}
                  </Button>
                  {CURRENT === plan.id && (
                    <Button variant="ghost" className="w-full mt-2 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-500/10" onClick={() => toast.info("Annulation gérée via le support")}>
                      Annuler mon abonnement
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-black">Historique de facturation</CardTitle>
            <CardDescription className="text-sm">Toutes les transactions KORA sur les 90 derniers jours</CardDescription>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => toast.success("Téléchargement du relevé")}>
            <Award className="h-4 w-4" /> Télécharger .pdf
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left">
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Désignation</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Montant</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {BILLING.map((b) => (
                  <tr key={b.id} className="border-b border-border/40 hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-3.5 font-medium">{b.label}</td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground hidden sm:table-cell">{b.date}</td>
                    <td className={cn(
                      "px-6 py-3.5 font-black tracking-tight",
                      b.status === "credit" ? "text-emerald-600" : b.status === "pending" ? "text-amber-600" : "text-foreground"
                    )}>
                      {b.amount}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant="outline" className={cn(
                        "gap-1 text-xs font-bold",
                        b.status === "paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                        b.status === "credit" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                                                   "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      )}>
                        {b.status === "paid" ? "Payé" : b.status === "credit" ? "Crédit" : "En attente"}
                      </Badge>
                    </td>
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
