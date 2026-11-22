import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { CheckCircle2, Crown, Info, Users } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { KButton } from "@/components/ui/KButton"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { cn } from "@/lib/utils"
import { CountUp, GOLD_RGB, Reveal, SectionHeader, Tilt, useLite, useSurface } from "./landingKit.jsx"

const PLAN_ORDER = ["FREE", "PRO", "BUSINESS"]
const PLAN_KEYS = { FREE: "Free", PRO: "Pro", BUSINESS: "Business" }

/* Les fonctionnalités des plans viennent de la base (en français). Traduction des intitulés connus. */
const FEATURE_EN = {
  "Gestion des talents": "Talent management",
  "Profil talent": "Talent profile",
  "Portfolio et médias": "Portfolio and media",
  "Gestion du cachet": "Fee management",
  "Gestion des demandes": "Request management",
  "Messagerie": "Messaging",
  "Notifications": "Notifications",
  "Gestion des projets": "Project management",
  "Profil manager": "Manager profile",
  "Organisation du portefeuille de talents": "Talent portfolio organisation",
}

export default function LandingPricing() {
  const { t, language } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const surface = useSurface()
  const lite = useLite()
  const reduce = useReducedMotion()
  const locale = language === "en" ? "en-GB" : "fr-FR"
  const fmt = (n) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, price, currency, talent_limit, features, is_active")
        .eq("is_active", true)
        .order("price", { ascending: true })
      if (cancelled) return
      if (error) {
        console.error("Erreur chargement plans publics :", error)
        setPlans([])
      } else {
        setPlans(data || [])
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  // Les cartes sont retrouvées par identifiant (FREE / PRO / BUSINESS), jamais par leur nom affiché.
  const cards = useMemo(
    () => PLAN_ORDER.map((id) => plans.find((p) => String(p.id).toUpperCase() === id)).filter(Boolean),
    [plans]
  )

  // Fonctionnalités communes à tous les plans (intersection des listes de la base).
  const shared = useMemo(() => {
    const lists = cards.map((p) => (Array.isArray(p.features) ? p.features.filter((f) => typeof f === "string") : []))
    if (!lists.length) return []
    return lists[0].filter((feature) => lists.every((list) => list.includes(feature)))
  }, [cards])

  const limitText = (plan) => {
    if (plan.talent_limit === null || plan.talent_limit === undefined) return t("landing.planLimitUnlimited")
    if (Number(plan.talent_limit) === 1) return t("landing.planLimitOne")
    return t("landing.planLimitMany", undefined, { count: plan.talent_limit })
  }

  const choosePlan = (plan) => {
    const id = String(plan.id).toUpperCase()
    if (id === "FREE") { navigate("/register?role=manager"); return }
    if (!["PRO", "BUSINESS"].includes(id)) return
    if (user?.role === "manager") { navigate(`/manager/subscription?checkout=${id}`); return }
    if (user) { toast.error(t("landing.managerAccountRequired")); return }
    try { sessionStorage.setItem("kora_pending_subscription_plan", id) } catch { /* le plan est aussi dans l'URL */ }
    navigate(`/register?role=manager&plan=${id}`)
  }

  return (
    <section id="pricing" className="kora-lp-section" aria-labelledby="pricing-title">
      <div className="kora-lp-container">
        <SectionHeader
          titleId="pricing-title"
          eyebrow={t("landing.pricingEyebrow")}
          title={t("landing.pricingTitle")}
          emphasis={t("landing.pricingTitleEmphasis")}
          description={t("landing.pricingDescription")}
        />

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-6 md:grid-cols-3 md:gap-7">
          {loading ? (
            [0, 1, 2].map((k) => <div key={k} className={cn("h-[27rem] animate-pulse rounded-[2rem]", surface)} />)
          ) : cards.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground md:col-span-3">{t("landing.unavailablePlans")}</p>
          ) : (
            cards.map((plan, i) => {
              const id = String(plan.id).toUpperCase()
              const key = PLAN_KEYS[id]
              const highlighted = id === "PRO"
              const price = Number(plan.price)
              const unlimited = plan.talent_limit === null || plan.talent_limit === undefined
              const LimitIcon = unlimited ? Crown : Users
              return (
                <Reveal key={id} direction={["left", "scale", "right"][i] || "up"} delay={i * 0.1} className="h-full">
                  <Tilt className={cn("relative h-full", highlighted && "md:z-10 md:scale-[1.04]")}>
                    {highlighted && (
                      <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
                        <motion.div
                          animate={reduce || lite ? undefined : { scale: [1, 1.06, 1] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                          className="gold-gradient rounded-full px-4 py-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-primary-foreground shadow-lg shadow-gold/30"
                        >
                          {t("landing.mostPopular")}
                        </motion.div>
                      </div>
                    )}
                    <div className={cn("relative h-full overflow-hidden rounded-[2rem]", highlighted && "p-[2px] shadow-2xl shadow-gold/20")}>
                      {highlighted && !lite && !reduce && (
                        <span
                          aria-hidden="true"
                          className="absolute -inset-[60%]"
                          style={{
                            background: `conic-gradient(from 0deg, transparent 0 55%, rgba(${GOLD_RGB},1) 80%, rgba(245,224,138,1) 90%, transparent 100%)`,
                            animation: "kora-lp-spin 4s linear infinite",
                          }}
                        />
                      )}
                      <Card className={cn("relative h-full rounded-[calc(2rem-2px)]", surface, highlighted && "border-gold/50 bg-card")}>
                        <CardContent className="flex h-full flex-col p-7 sm:p-8">
                          <h3 className="kora-lp-card-title text-[1.6rem]">{t(`landing.plan${key}Name`)}</h3>
                          <p className="kora-lp-body mt-1.5 min-h-[2.8rem]">{t(`landing.plan${key}Tagline`)}</p>

                          <div className="my-6 border-y border-border py-6">
                            {price > 0 ? (
                              <div className="flex items-baseline gap-2">
                                <span className="kora-lp-gold text-[3.4rem] font-extrabold leading-none tracking-tight">
                                  <CountUp value={price} format={fmt} />
                                </span>
                                <span className="text-sm font-bold text-muted-foreground">
                                  {plan.currency === "XOF" || !plan.currency ? "FCFA" : plan.currency} {t("landing.perMonth")}
                                </span>
                              </div>
                            ) : (
                              <span className="kora-lp-gold text-[3.4rem] font-extrabold leading-none tracking-tight">{t("landing.planFreeName")}</span>
                            )}
                          </div>

                          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-gold/12 px-4 py-3">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/20 text-gold-dark"><LimitIcon className="h-5 w-5" strokeWidth={2} /></span>
                            <span className="text-[0.95rem] font-extrabold">{limitText(plan)}</span>
                          </div>
                          <p className="flex items-start gap-2 text-sm font-semibold text-foreground/80">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            {t("landing.planAllFeatures")}
                          </p>

                          <div className="mt-auto pt-8">
                            <KButton variant={highlighted ? "gold" : "glass"} size="lg" arrow className="w-full justify-center" onClick={() => choosePlan(plan)}>
                              {id === "PRO" ? t("landing.choosePro") : id === "BUSINESS" ? t("landing.activateBusiness") : t("landing.startFree")}
                            </KButton>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </Tilt>
                </Reveal>
              )
            })
          )}
        </div>

        {shared.length > 0 && (
          <Reveal className="mx-auto mt-12 max-w-6xl">
            <div className={cn("rounded-[2rem] p-6 sm:p-8", surface)}>
              <h3 className="kora-lp-card-title mb-5 text-center text-xl">{t("landing.planIncludedTitle")}</h3>
              <ul className="flex flex-wrap justify-center gap-2.5">
                {shared.map((feature) => (
                  <li key={feature} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {language === "en" ? FEATURE_EN[feature] || feature : feature}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}

        <Reveal className="mx-auto mt-8 max-w-3xl">
          <p className="flex items-start justify-center gap-2.5 text-center text-sm font-semibold leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("landing.pricingValidationNote")} {t("landing.ctaNote")}</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
