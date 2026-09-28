import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

export default function PublicPricingSection({ fadeInUp, staggerContainer }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase
      .from("plans")
      .select("id, name, price, currency, talent_limit, features, trial_days, annual_discount_pct")
      .eq("is_active", true)
      .order("price")
      .then(({ data, error }) => {
        if (error) console.error("Erreur chargement plans publics :", error)
        if (mounted) setPlans(data || [])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
    >
      {plans.map((plan, i) => {
        const features = Object.entries(plan.features || {}).filter(([, enabled]) => enabled).map(([key]) => key.replace(/_/g, " "))
        const highlighted = plan.name === "Pro"

        return (
          <motion.div
            key={plan.id}
            variants={fadeInUp}
            custom={i}
            className="relative"
          >
            {highlighted && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="px-4 py-1.5 rounded-full gold-gradient text-xs font-black text-primary-foreground shadow-lg shadow-gold/30 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> POPULAIRE
                </div>
              </div>
            )}

            <Card className={`h-full ${highlighted ? "ring-2 ring-gold shadow-2xl shadow-gold/15" : ""}`}>
              <CardContent className="p-7">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.trial_days > 0 ? `${plan.trial_days} jours d'essai` : "Sans période d'essai"}
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-border/60">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black gold-text-gradient">
                      {Number(plan.price) === 0 ? "Gratuit" : formatCurrency(plan.price, plan.currency)}
                    </span>
                    {Number(plan.price) > 0 && <span className="text-sm text-muted-foreground font-semibold">/mois</span>}
                  </div>
                  {Number(plan.price) > 0 && Number(plan.annual_discount_pct) > 0 && (
                    <p className="mt-2 text-xs font-bold text-emerald-600">
                      -{plan.annual_discount_pct}% en annuel
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{plan.talent_limit == null ? "Talents illimités" : `Jusqu'à ${plan.talent_limit} talents`}</span>
                  </li>
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm capitalize">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full gap-2 font-bold" variant={highlighted ? "default" : "outline"}>
                  <Link to="/register">
                    Commencer <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
