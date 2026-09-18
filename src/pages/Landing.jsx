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
  Quote,
  TrendingUp,
  Briefcase,
  Award,
  ChevronRight,
  Play,
  Target,
  Rocket,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import LandingHeader from "@/components/landing/LandingHeader"
import LandingFooter from "@/components/landing/LandingFooter"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { cn, formatCurrency } from "@/lib/utils"
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

  const [stats, setStats] = useState([
    { value: "0", label: "Talents inscrits", icon: Users },
    { value: "0", label: "Projets", icon: Briefcase },
    { value: "0", label: "Pays représentés", icon: Globe },
    { value: "0/5", label: "Satisfaction moyenne", icon: Star },
  ])

  const [categoryCounts, setCategoryCounts] = useState(() =>
    Object.fromEntries(APP_PARAMS.categories.map((category) => [category.id, 0]))
  )

  const [testimonials, setTestimonials] = useState([])

  useEffect(() => {
    let channel
    let cancelled = false

    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "et")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    const categoryAliases = {
      tech: ["tech", "technology", "technologie", "digital", "technologie-digital", "development", "developpement"],
      creative: ["creative", "creatif", "design", "creatif-design", "creation"],
      business: ["business", "strategie", "business-strategie", "strategy", "consulting", "conseil"],
      marketing: ["marketing", "communication", "marketing-communication"],
      finance: ["finance", "comptabilite", "finance-comptabilite", "accounting"],
      legal: ["legal", "juridique", "droit", "juridique-conseil"],
      education: ["education", "formation", "formation-education", "training"],
      health: ["health", "sante", "bien-etre", "sante-bien-etre"],
    }

    const appCategoryKeys = Object.fromEntries(
      APP_PARAMS.categories.map((category) => [
        category.id,
        new Set([
          normalize(category.id),
          normalize(category.name),
          ...(categoryAliases[category.id] || []),
        ].map(normalize)),
      ])
    )

    const resolveAppCategoryId = (category) => {
      if (!category) return null

      const values = [category.id, category.slug, category.name]
        .map(normalize)
        .filter(Boolean)

      for (const appCategory of APP_PARAMS.categories) {
        const keys = appCategoryKeys[appCategory.id]
        if (values.some((value) => keys.has(value))) {
          return appCategory.id
        }
      }

      return null
    }

    const loadLandingData = async () => {
      try {
        const [
          talentResult,
          projectResult,
          categoryResult,
          countryResult,
          ratingResult,
          reviewResult,
        ] = await Promise.all([
          supabase
            .from("talent_profiles")
            .select("id, category_id, country_id"),

          supabase
            .from("projects")
            .select("id", { count: "exact", head: true }),

          supabase
            .from("categories")
            .select("id, slug, name"),

          supabase
            .from("talent_profiles")
            .select("country_id"),

          supabase
            .from("talent_profiles")
            .select("rating, reviews_count")
            .gt("reviews_count", 0),
          supabase
            .from("reviews")
            .select("id, author_name, role, country, avatar_url, rating, comment, created_at, is_visible")
            .eq("is_visible", true)
            .gte("rating", 3)
            .order("created_at", { ascending: false }),
        ])

        if (cancelled) return

        if (talentResult.error) {
          console.error("Erreur chargement talents Landing :", talentResult.error)
        }
        if (projectResult.error) {
          console.error("Erreur chargement projets Landing :", projectResult.error)
        }
        if (categoryResult.error) {
          console.error("Erreur chargement catégories Landing :", categoryResult.error)
        }
        if (countryResult.error) {
          console.error("Erreur chargement pays Landing :", countryResult.error)
        }
        if (ratingResult.error) {
          console.error("Erreur chargement évaluations Landing :", ratingResult.error)
        }
        if (reviewResult.error) {
          console.error("Erreur chargement avis Landing :", reviewResult.error)
        }

        const talents = talentResult.data || []
        const categories = categoryResult.data || []
        const countries = countryResult.data || []
        const ratedTalents = ratingResult.data || []
        const reviews = (reviewResult.data || []).filter((review) => {
          const rating = Number(review.rating)
          return Boolean(review.comment?.trim()) && Number.isFinite(rating) && rating >= 3
        })

        const categoryById = Object.fromEntries(
          categories.map((category) => [String(category.id), category])
        )

        const nextCategoryCounts = Object.fromEntries(
          APP_PARAMS.categories.map((category) => [category.id, 0])
        )

        for (const talent of talents) {
          const category = categoryById[String(talent.category_id)]
          const appCategoryId = resolveAppCategoryId(category)

          if (appCategoryId) {
            nextCategoryCounts[appCategoryId] += 1
          }
        }

        const uniqueCountryIds = new Set(
          countries
            .map((row) => row.country_id)
            .filter(Boolean)
            .map(String)
        )

        const averageRating = reviews.length
          ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
          : 0

        const shuffle = (items) => [...items].sort(() => Math.random() - 0.5)
        const highRated = shuffle(reviews.filter((review) => Number(review.rating) >= 4))
        const threePlusRated = shuffle(reviews.filter((review) => Number(review.rating) >= 3 && Number(review.rating) < 4))

        const selectedReviews = [
          ...highRated.slice(0, 2),
          ...threePlusRated.slice(0, 2),
        ]

        if (selectedReviews.length < 4) {
          const selectedIds = new Set(selectedReviews.map((review) => review.id))
          const fallback = shuffle(reviews.filter((review) => !selectedIds.has(review.id)))
          selectedReviews.push(...fallback.slice(0, 4 - selectedReviews.length))
        }

        const formattedReviews = shuffle(selectedReviews).map((review) => {
          const authorName = review.author_name?.trim() || "Membre KORA"
          const avatar = authorName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "K"

          return {
            id: review.id,
            name: authorName,
            role: review.role?.trim() || "Membre KORA",
            country: review.country?.trim() || "Afrique",
            avatar: avatar,
            avatarUrl: review.avatar_url || "",
            rating: Math.round(Number(review.rating)),
            text: review.comment.trim(),
            createdAt: review.created_at,
          }
        })

        setCategoryCounts(nextCategoryCounts)
        setTestimonials(formattedReviews)
        setStats([
          {
            value: String(talents.length),
            label: "Talents inscrits",
            icon: Users,
          },
          {
            value: String(projectResult.count ?? 0),
            label: "Projets",
            icon: Briefcase,
          },
          {
            value: String(uniqueCountryIds.size),
            label: "Pays représentés",
            icon: Globe,
          },
          {
            value: `${averageRating.toFixed(1)}/5`,
            label: "Satisfaction moyenne",
            icon: Star,
          },
        ])
      } catch (error) {
        console.error("Erreur inattendue chargement statistiques Landing :", error)
      }
    }

    loadLandingData()

    channel = supabase
      .channel("kora-landing-live-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "talent_profiles" },
        () => loadLandingData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => loadLandingData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => loadLandingData()
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Les mises à jour temps réel Supabase ne sont pas disponibles pour Landing.")
        }
      })

    return () => {
      cancelled = true
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const features = [
    {
      icon: Shield,
      title: "Talents vérifiés",
      description: "Chaque profil est soigneusement validé par notre équipe pour garantir qualité et fiabilité.",
      color: "from-emerald-400/20 to-emerald-500/10",
      iconColor: "text-emerald-600",
    },
    {
      icon: Zap,
      title: "Mise en relation express",
      description: "Trouvez le talent idéal en moins de 48h grâce à notre algorithme de matching intelligent.",
      color: "from-amber-400/20 to-amber-500/10",
      iconColor: "text-amber-600",
    },
    {
      icon: TrendingUp,
      title: "Paiements sécurisés",
      description: "Escrow, facturation automatique et paiements en plusieurs devises locales africaines.",
      color: "from-blue-400/20 to-blue-500/10",
      iconColor: "text-blue-600",
    },
    {
      icon: Target,
      title: "Suivi de projet",
      description: "Tableaux de bord, jalons, et rapports pour piloter vos collaborations en temps réel.",
      color: "from-rose-400/20 to-rose-500/10",
      iconColor: "text-rose-600",
    },
    {
      icon: Award,
      title: "Garantie qualité",
      description: "Satisfaction garantie ou remboursé sur chaque projet jusqu'à 14 jours après livraison.",
      color: "from-violet-400/20 to-violet-500/10",
      iconColor: "text-violet-600",
    },
    {
      icon: Rocket,
      title: "Support dédié 24/7",
      description: "Une équipe bilingue (FR/EN) disponible à tout moment pour vous accompagner.",
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
          <div className="absolute inset-0 pointer-events-none">
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
                <Sparkles className="h-4 w-4 text-gold-dark" />
                <span className="text-sm font-semibold text-gold-dark">✨ Nouvelle plateforme — Lancement officiel en Afrique de l'Ouest</span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                custom={1}
                className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
              >
                Révélez les talents{" "}
                <span className="gold-text-gradient italic">africains</span>
                <br />
                qui feront votre{" "}
                <span className="gold-text-gradient">succès</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                {APP_PARAMS.description} Des développeurs nigérians aux designers ivoiriens,
                en passant par les stratèges kényans — trouvez l'expert qu'il vous faut.
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
                <Button size="lg" variant="outline" className="gap-2 text-base font-bold">
                  <Play className="h-5 w-5" />
                  Voir la démo
                </Button>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                custom={4}
                className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground font-medium"
              >
                {["Paiement sécurisé", "Satisfait ou remboursé", "Support 24/7", "Sans engagement"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-20 relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-gold via-amber-300 to-gold rounded-3xl blur-xl opacity-25" />
              <div className="relative rounded-3xl border-2 border-gold/25 bg-card shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent/50 to-transparent border-b border-gold/15">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground ml-3">app.kora.africa — Talents recommandés</span>
                </div>
                <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    { name: "Nana K.", role: "Dev Fullstack • Senior", country: "🇬🇭 Ghana", tags: ["React", "Node.js", "TypeScript"], price: "55 000" },
                    { name: "Sadio M.", role: "Designer UI/UX", country: "🇸🇳 Sénégal", tags: ["Figma", "Design System", "Branding"], price: "40 000" },
                    { name: "Amaka O.", role: "Data Scientist", country: "🇳🇬 Nigéria", tags: ["Python", "ML", "SQL"], price: "70 000" },
                  ].map((t, i) => (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                      className="rounded-2xl border border-border/60 p-5 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 bg-background/50"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12 ring-2 ring-gold/30">
                          <AvatarFallback>{t.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.country}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold">4.9</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold mb-3">{t.role}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {t.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground">à partir de</p>
                          <p className="text-lg font-black gold-text-gradient">{formatCurrency(parseInt(t.price))}<span className="text-xs font-medium text-muted-foreground ml-1">/jour</span></p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">Voir profil</Button>
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
                Une plateforme complète pensée pour l'Afrique : paiements mobiles,
                profils vérifiés, support local et algorithme de matching intelligent.
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
                8 catégories,{" "}
                <span className="gold-text-gradient">milliers de talents</span>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mt-12"
            >
              <Button variant="outline" size="lg" onClick={() => navigate("/categories")} className="gap-2 font-bold">
                Voir toutes les catégories <ChevronRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </section>

        <section id="testimonials" className="py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-gold/8 via-amber-300/5 to-transparent blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <motion.div variants={fadeInUp} custom={0}>
                <Badge variant="gold" className="mb-5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                  Ils nous font confiance
                </Badge>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl font-black tracking-tight mb-5"
              >
                L'avis de notre <span className="gold-text-gradient">communauté</span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-muted-foreground"
              >
                Découvrez des avis publiés par la communauté KORA
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {testimonials.length > 0 ? (
                testimonials.map((t, i) => (
                  <motion.div
                    key={t.id}
                    variants={fadeInUp}
                    custom={i}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="h-full relative overflow-hidden">
                      <div className="absolute top-5 right-5 opacity-10">
                        <Quote className="h-16 w-16 text-gold-dark" />
                      </div>
                      <CardContent className="p-7 relative z-10">
                        <div className="flex gap-0.5 mb-5">
                          {Array.from({ length: t.rating }).map((_, j) => (
                            <Star key={j} className="h-5 w-5 text-amber-500 fill-amber-500" />
                          ))}
                        </div>
                        <p className="text-foreground leading-relaxed mb-6 text-base font-medium">
                          "{t.text}"
                        </p>
                        <Separator className="mb-5" />
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 ring-2 ring-gold/30">
                            {t.avatarUrl ? (
                              <img src={t.avatarUrl} alt={t.name} className="h-full w-full object-cover rounded-full" />
                            ) : null}
                            <AvatarFallback>{t.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{t.name}</p>
                            <p className="text-sm text-muted-foreground">{t.role} • {t.country}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="md:col-span-2 text-center py-16 text-muted-foreground">
                  Aucun avis publié pour le moment.
                </div>
              )}
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
              {[
                {
                  name: APP_PARAMS.plans.free.name,
                  price: APP_PARAMS.plans.free.price,
                  description: "Pour découvrir et tester la plateforme",
                  features: ["Publication de projet", "Accès aux profils publics", "1 candidatures", "Support email"],
                  cta: "Commencer",
                  highlighted: false,
                },
                {
                  name: APP_PARAMS.plans.pro.name,
                  price: APP_PARAMS.plans.pro.price,
                  period: "FCFA/mois",
                  description: "Pour les talents et indépendants sérieux",
                  features: ["Tout le plan Gratuit", "Profil vérifié & prioritaire", "Candidatures illimitées", "Support WhatsApp", "Alertes projets premium", "Paiement sécurisé"],
                  cta: "Essayer 30 jours",
                  highlighted: true,
                },
                {
                  name: APP_PARAMS.plans.business.name,
                  price: APP_PARAMS.plans.business.price,
                  period: "FCFA/mois",
                  description: "Pour équipes et PME qui recrutent",
                  features: ["Tout le plan Pro", "Projets illimités", "Team members (5)", "Account manager dédié", "Facturation entreprise"],
                  cta: "Contacter",
                  highlighted: false,
                },
              ].map((plan, i) => (
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
                            {plan.price === 0 ? "Gratuit" : formatCurrency(plan.price).replace("FCFA", "")}
                          </span>
                          {plan.period && <span className="text-sm text-muted-foreground font-semibold">{plan.period}</span>}
                        </div>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((f) => (
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
                        {plan.cta} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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
                  <span className="text-sm font-bold">Rejoignez plus de 5 000 talents africains</span>
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
                    onClick={() => navigate("/register?role=talent")}
                  >
                    <Sparkles className="h-5 w-5" />
                    Managers
                  </Button>
                </div>
                <p className="mt-6 text-sm opacity-80 font-medium">
                  Sans engagement • Annulation à tout moment • Support 24/7
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
