import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Globe,
  Users,
  Star,
  TrendingUp,
  Briefcase,
  Award,
  Target,
  Rocket,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LandingHeader from "@/components/landing/LandingHeader"
import LandingHero from "@/components/landing/LandingHero"
import LandingEvolution from "@/components/landing/LandingEvolution.jsx"
import LandingFooter from "@/components/landing/LandingFooter"
import ReviewSection from "@/components/ReviewSection.jsx"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { cn } from "@/lib/utils"
import { useKoraStats } from "@/lib/useKoraStats"
import { supabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { useAuth } from "@/lib/AuthContext"
import { toast } from "sonner"

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

export default function Landing() {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const { user } = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { stats: liveStats, categoryCounts } = useKoraStats()

  const stats = liveStats.map((stat) => ({
    ...stat,
    label: stat.label === "Talents inscrits" ? t("landing.statsTalents")
      : stat.label === "Projets" ? t("landing.statsProjects")
      : stat.label === "Pays représentés" ? t("landing.statsCountries")
      : t("landing.statsSatisfaction"),
    icon: stat.label === "Talents inscrits" ? Users
      : stat.label === "Projets" ? Briefcase
      : stat.label === "Pays représentés" ? Globe
      : Star,
  }))

  const [publicPlans, setPublicPlans] = useState([])
  const [landingDataLoading, setLandingDataLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadPublicData = async () => {
      setLandingDataLoading(true)

      try {
        const plansResult = await supabase
          .from("plans")
          .select("id, name, price, currency, duration_months, talent_limit, features, trial_days, annual_discount_pct, is_active")
          .eq("is_active", true)
          .order("price", { ascending: true })

        if (cancelled) return

        if (plansResult.error) {
          console.error("Erreur chargement plans publics :", plansResult.error)
          setPublicPlans([])
        } else {
          setPublicPlans(plansResult.data || [])
        }

      } finally {
        if (!cancelled) setLandingDataLoading(false)
      }
    }

    loadPublicData()

    return () => {
      cancelled = true
    }
  }, [])

  const PLAN_DETAILS = {
    "Gratuit": [
      t("landing.planFreeFeature1"), t("landing.planFreeFeature2"), t("landing.planFreeFeature3"), t("landing.planFreeFeature4"), t("landing.planFreeFeature5"),
    ],
    "Pro": [
      t("landing.planProFeature1"), t("landing.planProFeature2"), t("landing.planProFeature3"), t("landing.planProFeature4"), t("landing.planProFeature5"),
    ],
    "Business": [
      t("landing.planBusinessFeature1"), t("landing.planBusinessFeature2"), t("landing.planBusinessFeature3"), t("landing.planBusinessFeature4"), t("landing.planBusinessFeature5"),
    ],
  }

  const formatPlanPrice = (plan) => {
    const price = Number(plan?.price)
    if (!Number.isFinite(price) || price <= 0) return t("landing.planFreeName")

    return new Intl.NumberFormat(language === "en" ? "en-GB" : "fr-FR", {
      maximumFractionDigits: 0,
    }).format(price)
  }

  const planCards = ["Gratuit", "Pro", "Business"]
    .map((planName) => publicPlans.find((plan) => plan.name === planName))
    .filter(Boolean)
    .map((plan) => ({
      ...plan,
      displayName: plan.name === "Gratuit" ? t("landing.planFreeName") : plan.name === "Pro" ? t("landing.planProName") : t("landing.planBusinessName"),
      description:
        plan.name === "Gratuit"
          ? t("landing.planFreeDescription")
          : plan.name === "Pro"
            ? t("landing.planProDescription")
            : t("landing.planBusinessDescription"),
      featureList: PLAN_DETAILS[plan.name] || [],
      highlighted: plan.name === "Pro",
      period: plan.name === "Gratuit" ? "" : t("landing.perMonth"),
    }))

  const handlePlanSelection = (plan) => {
    const planId = String(plan?.id || "").toUpperCase()
    if (planId === "FREE") {
      navigate("/register?role=manager")
      return
    }
    if (!["PRO", "BUSINESS"].includes(planId)) return

    if (user?.role === "manager") {
      navigate(`/manager/subscription?checkout=${planId}`)
      return
    }

    if (user) {
      toast.error(t("landing.managerAccountRequired"))
      return
    }

    try {
      sessionStorage.setItem("kora_pending_subscription_plan", planId)
    } catch {
      // The plan is also carried in the registration URL.
    }
    navigate(`/register?role=manager&plan=${planId}`)
  }

  const categoryLabels = {
    music: t("landing.categoryMusic"),
    fashion: t("landing.categoryFashion"),
    influence: t("landing.categoryInfluence"),
    sport: t("landing.categorySport"),
    events: t("landing.categoryEvents"),
    culture: t("landing.categoryCulture"),
    cinema: t("landing.categoryCinema"),
    voice: t("landing.categoryVoice"),
    comedy: t("landing.categoryComedy"),
    beauty: t("landing.categoryBeauty"),
    gastronomy: t("landing.categoryGastronomy"),
  }

  const features = [
    {
      icon: Shield,
      title: t("landing.featureProfilesTitle"),
      description: t("landing.featureProfilesDescription"),
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      icon: Zap,
      title: t("landing.featureSearchTitle"),
      description: t("landing.featureSearchDescription"),
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      icon: TrendingUp,
      title: t("landing.featureSubscriptionTitle"),
      description: t("landing.featureSubscriptionDescription"),
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      icon: Target,
      title: t("landing.featureCollaborationTitle"),
      description: t("landing.featureCollaborationDescription"),
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      icon: Award,
      title: t("landing.featurePublishedTitle"),
      description: t("landing.featurePublishedDescription"),
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      icon: Rocket,
      title: t("landing.featureWorkspaceTitle"),
      description: t("landing.featureWorkspaceDescription"),
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
  ]



  return (
    <div className="min-h-screen flex flex-col kora-public-shell">
          <LandingHero />

        <LandingEvolution stats={stats} t={t} language={language} />

        <section id="how-it-works" className="kora-process-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="kora-page-intro text-center mx-auto max-w-3xl mb-12">
              <p className="kora-hero-eyebrow">{t("landing.processEyebrow")}</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">{language === "en" ? "From discovery to collaboration" : "De la recherche à la collaboration"}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">{t("landing.processDescription")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <motion.article initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} whileHover={{ y: -6 }} transition={{ duration: 0.45 }} className="kora-process-card">
                <span className="kora-process-number">01</span>
                <Users className="h-6 w-6" strokeWidth={1.7} />
                <h3>{t("landing.processStep1Title")}</h3>
                <p>{t("landing.processStep1Description")}</p>
              </motion.article>
              <article className="kora-process-card">
                <span className="kora-process-number">02</span>
                <Target className="h-6 w-6" strokeWidth={1.7} />
                <h3>{t("landing.processStep2Title")}</h3>
                <p>{t("landing.processStep2Description")}</p>
              </article>
              <article className="kora-process-card">
                <span className="kora-process-number">03</span>
                <Briefcase className="h-6 w-6" strokeWidth={1.7} />
                <h3>{t("landing.processStep3Title")}</h3>
                <p>{t("landing.processStep3Description")}</p>
              </article>
            </div>
          </div>
        </section>



        <LandingHero />



        <section id="categories" className="py-24 lg:py-32 bg-gradient-to-b from-transparent via-accent/20 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <motion.div variants={fadeInUp} custom={0}>
                <Badge variant="default" className="mb-5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                  {t("landing.categoriesEyebrow")}
                </Badge>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl font-black tracking-tight mb-5"
              >
                {APP_PARAMS.categories.length} {t("landing.categoriesTitle")}{" "}
                <span className="gold-text-gradient">{t("landing.categoriesTitleEmphasis")}</span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-muted-foreground"
              >
                {t("landing.categoriesDescription")}
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-5"
            >
              {APP_PARAMS.categories.map((cat, i) => {
                const Icon = getCategoryIcon(cat.icon)
                return (
                  <motion.div
                    key={cat.id}
                    variants={fadeInUp}
                    custom={i}
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Link to="/categories" className="block h-full">
                      <Card className="h-full cursor-pointer group">
                        <CardContent className="p-0 text-left">
                          <div className="flex flex-col items-center justify-center gap-4 px-5 py-8 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <Icon className="h-8 w-8" strokeWidth={1.7} />
                            </div>
                          <h3 className="font-bold text-foreground mb-2 line-clamp-2 min-h-[3.5rem]">{categoryLabels[cat.id] || cat.name}</h3>
                          <p className="text-sm font-semibold text-primary">
                            {(categoryCounts[cat.id] ?? 0).toLocaleString(language === "en" ? "en-GB" : "fr-FR")} {t("landing.talentsCount")}
                          </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>

          </div>
        </section>


        <section id="why-kora" className="py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <motion.div variants={fadeInUp} custom={0}>
                <Badge variant="gold" className="mb-5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                  {language === "en" ? "WHY KORA?" : "POURQUOI KORA ?"}
                </Badge>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl font-black tracking-tight mb-5"
              >
                {language === "en" ? "Why KORA?" : "Pourquoi KORA ?"}{" "}
                <span className="gold-text-gradient"></span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-muted-foreground leading-relaxed"
              >
                {language === "en" ? "A platform designed to make talent discovery and professional collaborations easier." : "Une plateforme pensée pour faciliter la découverte des talents et les collaborations professionnelles."}
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    variants={fadeInUp}
                    custom={i}
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="h-full overflow-hidden">
                      <CardContent className="p-7">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br", feature.color)}>
                          <Icon className={cn("h-7 w-7", feature.iconColor)} strokeWidth={2} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>



        <section id="pricing" className="py-24 lg:py-32 bg-gradient-to-b from-accent/20 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <motion.div variants={fadeInUp} custom={0}>
                <Badge variant="default" className="mb-5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                  {t("landing.pricingEyebrow")}
                </Badge>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl font-black tracking-tight mb-5"
              >
                {t("landing.pricingTitle")} <span className="gold-text-gradient">{t("landing.pricingTitleEmphasis")}</span>
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {landingDataLoading ? (
                <div className="md:col-span-3 text-center py-12 text-sm text-muted-foreground">
                  {t("landing.loadingPlans")}
                </div>
              ) : planCards.length === 0 ? (
                <div className="md:col-span-3 text-center py-12 text-sm text-muted-foreground">
                  {t("landing.unavailablePlans")}
                </div>
              ) : (
                planCards.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  variants={fadeInUp}
                  custom={i}
                  whileHover={{ y: plan.highlighted ? -8 : -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={cn("relative", plan.highlighted && "md:-translate-y-4")}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="px-4 py-1.5 rounded-full gold-gradient text-xs font-black text-primary-foreground shadow-lg shadow-gold/30">
                        {t("landing.mostPopular")}
                      </div>
                    </div>
                  )}
                  <Card className={cn("h-full", plan.highlighted && "ring-2 ring-gold shadow-2xl shadow-gold/15")}>
                    <CardContent className="p-7">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="mb-6 pb-6 border-b border-border/60">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black gold-text-gradient">
                            {formatPlanPrice(plan)}
                          </span>
                          {plan.period && <span className="text-sm text-muted-foreground font-semibold">{plan.period}</span>}
                        </div>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {plan.featureList.map((f) => (
                          <li key={f} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground/90">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full gap-2 font-bold"
                        variant={plan.highlighted ? "default" : "outline"}
                        onClick={() => handlePlanSelection(plan)}
                      >
                        {plan.name === "Pro" ? t("landing.choosePro") : plan.name === "Business" ? t("landing.activateBusiness") : t("landing.startFree")} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  )
}
