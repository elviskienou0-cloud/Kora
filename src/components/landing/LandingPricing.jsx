import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, Crown, Info, Users } from "lucide-react"
import { toast } from "sonner"
import { KButton } from "@/components/ui/KButton"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { Reveal, SectionHeader } from "./landingKit.jsx"

const PLAN_ORDER = ["FREE", "PRO", "BUSINESS"]

const FEATURE_EN = {
  "Gestion des talents": "Talent management",
  "Profil talent": "Talent profiles",
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
  const planCopy = {
    FREE: {
      name: t("landing.planFreeName"),
      tagline: t("landing.planFreeTagline"),
    },
    PRO: {
      name: t("landing.planProName"),
      tagline: t("landing.planProTagline"),
    },
    BUSINESS: {
      name: t("landing.planBusinessName"),
      tagline: t("landing.planBusinessTagline"),
    },
  }
  const navigate = useNavigate()
  const locale = language === "en" ? "en-GB" : "fr-FR"
  const formatPrice = (value) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("plans")
          .select("id, name, price, currency, talent_limit, trial_days, features, is_active")
          .eq("is_active", true)
          .order("price", { ascending: true })

        if (cancelled) return
        if (error) {
          console.error("Erreur chargement plans publics :", error)
          setPlans([])
        } else {
          setPlans(data || [])
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Erreur réseau pendant le chargement des offres KORA :", error)
          setPlans([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPlans()
    return () => { cancelled = true }
  }, [])

  const cards = useMemo(
    () => PLAN_ORDER.map((id) => plans.find((plan) => String(plan.id).toUpperCase() === id)).filter(Boolean),
    [plans]
  )

  const limitText = (plan) => {
    if (plan.talent_limit === null || plan.talent_limit === undefined) return t("landing.planLimitUnlimited")
    if (Number(plan.talent_limit) === 1) return t("landing.planLimitOne")
    return t("landing.planLimitMany", undefined, { count: plan.talent_limit })
  }

  const choosePlan = (plan) => {
    const id = String(plan.id).toUpperCase()
    if (id === "FREE") {
      navigate("/register?role=manager")
      return
    }
    if (!["PRO", "BUSINESS"].includes(id)) return
    if (user?.role === "manager") {
      navigate("/manager/subscription?checkout=" + id)
      return
    }
    if (user) {
      toast.error(t("landing.managerAccountRequired"))
      return
    }
    try {
      sessionStorage.setItem("kora_pending_subscription_plan", id)
    } catch {
      // Le plan est également transmis dans l'URL.
    }
    navigate("/register?role=manager&plan=" + id)
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

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-4 md:grid-cols-3" aria-busy={loading}>
          {loading ? (
            [0, 1, 2].map((item) => <div key={item} aria-hidden="true" className="h-80 animate-pulse rounded-3xl border border-border bg-card" />)
          ) : cards.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground md:col-span-3">{t("landing.unavailablePlans")}</p>
          ) : (
            cards.map((plan, index) => {
              const id = String(plan.id).toUpperCase()
              const copy = planCopy[id]
              const highlighted = id === "PRO"
              const price = Number(plan.price)
              const unlimited = plan.talent_limit === null || plan.talent_limit === undefined
              const LimitIcon = unlimited ? Crown : Users
              const currency = plan.currency === "XOF" || !plan.currency ? "FCFA" : plan.currency

              return (
                <Reveal key={id} delay={index * 0.05} className="h-full">
                  <article className={"kora-lp-plan-card flex h-full flex-col " + (highlighted ? "kora-lp-plan-card-featured" : "")}>
                    {highlighted && <span className="kora-lp-plan-badge">{t("landing.mostPopular")}</span>}
                    <div>
                      <h3 className="kora-lp-card-title text-2xl">{copy.name}</h3>
                      <p className="kora-lp-body mt-2 min-h-10">{copy.tagline}</p>

                      <div className="my-5 border-y border-border py-5">
                        {price > 0 ? (
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="kora-lp-plan-price">{formatPrice(price)}</span>
                            <span className="text-sm font-semibold text-muted-foreground">{currency} {t("landing.perMonth")}</span>
                          </div>
                        ) : (
                          <span className="kora-lp-plan-price">{copy.name}</span>
                        )}
                        {Number(plan.trial_days) > 0 && (
                          <p className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {plan.trial_days} {t("landing.trialDaysLabel")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-gold/10 px-4 py-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-dark">
                          <LimitIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-extrabold">{limitText(plan)}</span>
                      </div>
                      {Array.isArray(plan.features) && plan.features.length > 0 ? (
                        <ul className="mt-5 space-y-2.5">
                          {plan.features.filter((feature) => typeof feature === "string").map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm leading-relaxed">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                              <span>{language === "en" ? FEATURE_EN[feature] || feature : feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-5 text-sm text-muted-foreground">
                          {language === "en" ? "Feature details are not available." : "Détails des fonctionnalités non renseignés."}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto pt-7">
                      <KButton
                        variant={highlighted ? "gold" : "glass"}
                        size="lg"
                        arrow
                        className="w-full"
                        onClick={() => choosePlan(plan)}
                      >
                        {id === "PRO" ? t("landing.choosePro") : id === "BUSINESS" ? t("landing.activateBusiness") : t("landing.startFree")}
                      </KButton>
                    </div>
                  </article>
                </Reveal>
              )
            })
          )}
        </div>

        <Reveal className="mx-auto mt-7 max-w-3xl">
          <p className="flex items-start justify-center gap-2 text-center text-sm leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t("landing.pricingValidationNote")} {t("landing.ctaNote")}</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
