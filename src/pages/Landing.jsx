import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, useScroll, useTransform } from "framer-motion"
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
  ChevronRight,
  Target,
  Rocket,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import LandingHeader from "@/components/landing/LandingHeader"
import LandingFooter from "@/components/landing/LandingFooter"
import ReviewSection from "@/components/ReviewSection.jsx"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { cn, formatCurrency } from "@/lib/utils"
import { useKoraStats } from "@/lib/useKoraStats"
import { supabase } from "@/lib/supabase"

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
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { stats: liveStats, categoryCounts } = useKoraStats()

  const stats = liveStats.map((stat) => ({
    ...stat,
    icon: stat.label === "Talents inscrits" ? Users
      : stat.label === "Projets" ? Briefcase
      : stat.label === "Pays représentés" ? Globe
      : Star,
  }))

  const [publicPlans, setPublicPlans] = useState([])
  const [featuredTalents, setFeaturedTalents] = useState([])
  const [landingDataLoading, setLandingDataLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadPublicData = async () => {
      setLandingDataLoading(true)

      try {
        const [plansResult, talentsResult] = await Promise.all([
          supabase
            .from("plans")
            .select("id, name, price, currency, duration_months, talent_limit, features, trial_days, annual_discount_pct, is_active")
            .eq("is_active", true)
            .order("price", { ascending: true }),

          supabase
            .from("talent_profiles")
            .select("id, first_name, last_name, title, city, daily_rate, currency, rating, reviews_count, verified, categories(name), countries(name), talent_profile_skills(skills(name))")
            .eq("status", "published")
            .eq("is_visible", true)
            .order("rating", { ascending: false })
            .limit(3),
        ])

        if (cancelled) return

        if (plansResult.error) {
          console.error("Erreur chargement plans publics :", plansResult.error)
          setPublicPlans([])
        } else {
          setPublicPlans(plansResult.data || [])
        }

        if (talentsResult.error) {
          console.error("Erreur chargement talents mis en avant :", talentsResult.error)
          setFeaturedTalents([])
        } else {
          setFeaturedTalents(talentsResult.data || [])
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
      "1 talent maximum",
      "Profil manager et outils essentiels",
      "Gestion des demandes",
      "Accès gratuit",
      "Sans paiement",
    ],
    "Pro": [
      "Jusqu’à 3 talents",
      "Outils professionnels complets",
      "Gestion des profils et projets",
      "0 % de commission KORA",
      "Paiement d’abonnement mensuel",
    ],
    "Business": [
      "Talents illimités",
      "Tous les outils professionnels",
      "Gestion professionnelle des talents",
      "Suivi des abonnements et demandes",
      "Sans commission KORA sur les prestations",
    ],
  }

  const formatPlanPrice = (plan) => {
    const price = Number(plan?.price)
    if (!Number.isFinite(price) || price <= 0) return "Gratuit"

    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(price)
  }

  const planCards = ["Gratuit", "Pro", "Business"]
    .map((planName) => publicPlans.find((plan) => plan.name === planName))
    .filter(Boolean)
    .map((plan) => ({
      ...plan,
      description:
        plan.name === "Gratuit"
          ? "Pour découvrir KORA gratuitement"
          : plan.name === "Pro"
            ? "Pour développer votre activité"
            : "Pour développer votre activité sur KORA",
      featureList: PLAN_DETAILS[plan.name] || [],
      highlighted: plan.name === "Pro",
      period: plan.name === "Gratuit" ? "" : "/ mois",
    }))

  const features = [
    {
      icon: Shield,
      title: "Profils structurés",
      description: "Des profils organisés avec compétences, catégories, portfolio et informations utiles pour décider plus vite.",
      color: "from-emerald-400/20 to-emerald-500/10",
      iconColor: "text-emerald-600",
    },
    {
      icon: Zap,
      title: "Recherche ciblée",
      description: "Filtrez les profils selon vos besoins et contactez le manager du talent qui correspond à votre projet.",
      color: "from-amber-400/20 to-amber-500/10",
      iconColor: "text-amber-600",
    },
    {
      icon: TrendingUp,
      title: "Paiement d’abonnement clair",
      description: "Les abonnements Manager sont affichés clairement et les paiements KORA passent actuellement par SasPay.",
      color: "from-blue-400/20 to-blue-500/10",
      iconColor: "text-blue-600",
    },
    {
      icon: Target,
      title: "Suivi des collaborations",
      description: "Centralisez demandes, projets, messages et notifications dans votre espace KORA.",
      color: "from-rose-400/20 to-rose-500/10",
      iconColor: "text-rose-600",
    },
    {
      icon: Award,
      title: "Profils publiés",
      description: "Les profils publiés et les fonctionnalités disponibles sont affichés selon les données actuelles de KORA.",
      color: "from-violet-400/20 to-violet-500/10",
      iconColor: "text-violet-600",
    },
    {
      icon: Rocket,
      title: "Espace de collaboration",
      description: "Centralisez demandes, projets, messages et notifications dans votre espace KORA.",
      color: "from-cyan-400/20 to-cyan-500/10",
      iconColor: "text-cyan-600",
    },
  ]



  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        <motion.section
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute top-20 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-gold/20 via-amber-300/10 to-transparent blur-3xl" />
            <div className="absolute top-60 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-amber-400/15 via-yellow-300/10 to-transparent blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-gradient-to-t from-gold/10 to-transparent blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div variants={fadeInUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-dark" aria-hidden="true" />
                <span className="text-sm font-semibold text-gold-dark">Nouvelle plateforme — Lancement officiel en Afrique de l'Ouest</span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                custom={1}
                className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
              >
                Révélez les talents{" "}
                <span className="text-gold-dark italic">africains</span>
                <br />
                qui feront votre{" "}
                <span className="text-gold-dark">succès</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                {APP_PARAMS.description} Explorez les profils réellement publiés sur KORA et contactez le manager du talent qui correspond à votre besoin.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                custom={3}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                <Button size="lg" onClick={() => navigate("/register")} className="gap-2 text-base font-bold">
                  Commencer gratuitement
                  <ArrowRight className="h-5 w-5" />
                </Button>
                
              </motion.div>

              <motion.div
                variants={fadeInUp}
                custom={4}
                className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground font-medium"
              >
                {["Profils et données réels", "Plans affichés depuis KORA", "Paiement d’abonnement via SasPay", "Sans engagement"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              id="talents"
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-20 relative"
            >
              <div className="absolute -inset-px rounded-3xl border border-gold/15 opacity-70" />
              <div className="relative rounded-3xl border border-border bg-card shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent/50 to-transparent border-b border-gold/15">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground ml-3">app.kora.africa — Talents recommandés</span>
                </div>
                <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
                  {featuredTalents.length === 0 ? (
                    <div className="md:col-span-3 py-12 text-center text-sm text-muted-foreground">
                      Aucun talent publié pour le moment.
                    </div>
                  ) : featuredTalents.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                      className="rounded-2xl border border-border/60 p-5 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 bg-background/50"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12 ring-2 ring-gold/30">
                          <AvatarFallback>{[t.first_name, t.last_name].filter(Boolean).join(" ").split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join("").toUpperCase() || "T"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground">{[t.first_name, t.last_name].filter(Boolean).join(" ").trim() || t.title || "Talent"}</p>
                          <p className="text-xs text-muted-foreground">{t.countries?.name || t.city || "Localisation non renseignée"}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold">{Number(t.rating || 0) > 0 ? Number(t.rating).toFixed(1) : "—"}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold mb-3">{t.title || "Talent"}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(t.talent_profile_skills || []).map((row) => row.skills?.name).filter(Boolean).slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground">à partir de</p>
                          <p className="text-lg font-black gold-text-gradient">{formatCurrency(t.daily_rate, t.currency || "XOF")}<span className="text-xs font-medium text-muted-foreground ml-1">/jour</span></p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs" onClick={(event) => { event.stopPropagation(); navigate(`/talent/${t.id}`) }}>Voir profil</Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <section className="py-16 border-y border-gold/15 bg-gradient-to-b from-accent/20 via-transparent to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    variants={fadeInUp}
                    custom={i}
                    className="text-center group"
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/10 mb-4 group-hover:bg-gold/20 transition-colors">
                      <Icon className="h-7 w-7 text-gold-dark" strokeWidth={2} />
                    </div>
                    <div className="text-3xl sm:text-4xl font-black gold-text-gradient mb-2">{stat.value}</div>
                    <div className="text-sm font-semibold text-muted-foreground">{stat.label}</div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-24 lg:py-32">
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
                  Pourquoi KORA ?
                </Badge>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl font-black tracking-tight mb-5"
              >
                Tout ce qu'il faut pour{" "}
                <span className="gold-text-gradient">collaborer en confiance</span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-muted-foreground leading-relaxed"
              >
                Une plateforme qui centralise les profils publiés, les recherches, les demandes, les projets et les échanges entre clients et managers.
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
                  Explorer par domaine
                </Badge>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl font-black tracking-tight mb-5"
              >
                {APP_PARAMS.categories.length} catégories,{" "}
                <span className="gold-text-gradient">une communauté en croissance</span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-muted-foreground"
              >
                Parcourez les expertises les plus demandées sur le continent
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
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 mx-auto rounded-2xl gold-gradient flex items-center justify-center mb-4 shadow-lg shadow-gold/25 group-hover:shadow-xl group-hover:shadow-gold/40 transition-all duration-300">
                            <Icon className="h-8 w-8 text-primary-foreground" strokeWidth={2} />
                          </div>
                          <h3 className="font-bold text-foreground mb-2 line-clamp-2 min-h-[3.5rem]">{cat.name}</h3>
                          <p className="text-sm font-semibold gold-text-gradient">
                            {(categoryCounts[cat.id] ?? 0).toLocaleString("fr-FR")} talents
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>

          </div>
        </section>

        <section id="testimonials" className="py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-gold/8 via-amber-300/5 to-transparent blur-3xl" />
          </div>

          <div className="relative px-4 sm:px-6 lg:px-8">
            <ReviewSection
              title="L'avis de notre communauté"
              showForm
            />
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
                  Nos tarifs
                </Badge>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl font-black tracking-tight mb-5"
              >
                Des plans simples, <span className="gold-text-gradient">sans surprise</span>
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
                  Chargement des offres…
                </div>
              ) : planCards.length === 0 ? (
                <div className="md:col-span-3 text-center py-12 text-sm text-muted-foreground">
                  Les offres publiques ne sont pas disponibles pour le moment.
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
                        ⭐ LE PLUS POPULAIRE
                      </div>
                    </div>
                  )}
                  <Card className={cn("h-full", plan.highlighted && "ring-2 ring-gold shadow-2xl shadow-gold/15")}>
                    <CardContent className="p-7">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
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
                        onClick={() => navigate("/register")}
                      >
                        {plan.name === "Pro" ? "Choisir Pro" : plan.name === "Business" ? "Activer Business" : "Commencer gratuitement"} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </section>

        <section className="py-24 lg:py-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="relative rounded-[2.5rem] overflow-hidden"
            >
              <div className="absolute inset-0 gold-gradient opacity-95" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_50%)]" />
              <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

              <motion.div
                variants={fadeInUp}
                custom={0}
                className="relative p-10 sm:p-14 lg:p-20 text-center text-primary-foreground"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-8 border border-white/30">
                  <Heart className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold">Rejoignez la communauté de {liveStats.find((stat) => stat.label === "Talents inscrits")?.value ?? "0"} talents africains</span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
                  Prêt à transformer
                  <br />
                  votre façon de travailler ?
                </h2>
                <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                  Inscrivez-vous en moins de 2 minutes et commencez à trouver les opportunités ou les talents dont vous avez besoin.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    className="bg-background text-foreground hover:bg-background/90 gap-2 font-black"
                    onClick={() => navigate("/register?role=client")}
                  >
                    Clients <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/60 text-primary-foreground hover:bg-white/20 gap-2 font-black"
                    onClick={() => navigate("/register?role=manager")}
                  >
                    <Sparkles className="h-5 w-5" />
                    Managers
                  </Button>
                </div>
                <p className="mt-6 text-sm opacity-80 font-medium">
                  Sans engagement • Abonnement mensuel sans renouvellement automatique
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
