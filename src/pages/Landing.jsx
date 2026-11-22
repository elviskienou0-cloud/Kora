import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  animate, AnimatePresence, motion, MotionConfig, useInView, useMotionTemplate, useMotionValue,
  useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform,
} from "framer-motion"
import {
  CheckCircle2, ChevronUp, Plus, Shield, Zap, Globe, Users, Star,
  TrendingUp, Briefcase, Award, Target, Rocket,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GlassBar, KButton } from "@/components/ui/KButton"
import LandingHero from "@/components/landing/LandingHero"
import LandingEvolution from "@/components/landing/LandingEvolution.jsx"
import LandingFooter from "@/components/landing/LandingFooter"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { cn } from "@/lib/utils"
import { useKoraStats } from "@/lib/useKoraStats"
import { supabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { useAuth } from "@/lib/AuthContext"
import { toast } from "sonner"

const EASE = [0.22, 1, 0.36, 1]
const GOLD = "212,175,55"
const SECTION_IDS = ["categories", "pricing", "faq"]

function scrollToSection(id, reduceMotion = false) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
}
/* Style "verre dépoli" partagé par les cartes (même recette que GlassBar) */
const GLASS =
  "border border-foreground/10 bg-foreground/[0.05] backdrop-blur-xl backdrop-saturate-150 " +
  "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]"

const CSS = `
@keyframes kora-spin{to{transform:rotate(360deg)}}
@keyframes koraAurora{50%{transform:translate3d(6vw,-5vh,0) scale(1.18)}}
@keyframes koraFlow{to{background-position:100% 50%}}
@keyframes kora-rl{to{transform:translateX(-50%)}}
@keyframes kora-rr{from{transform:translateX(-50%)}to{transform:translateX(0)}}
.kora-mq{overflow:hidden}
.kora-marquee-track{display:flex;width:max-content;gap:1.25rem;animation:kora-rl 38s linear infinite}
.kora-marquee-track.reverse{animation-name:kora-rr}
.kora-mq:hover .kora-marquee-track{animation-play-state:paused}
.kora-marquee-item{display:flex;min-width:190px;align-items:center;gap:.9rem;border:1px solid rgba(212,175,55,.22);border-radius:1.25rem;padding:1rem 1.25rem;background:rgba(255,255,255,.045);backdrop-filter:blur(16px)}
@media (prefers-reduced-motion:reduce){.kora-marquee-track{animation:none!important}}
.kora-aurora{animation:koraAurora 18s ease-in-out infinite}
.gold-text-gradient{background-size:200% 200%;animation:koraFlow 5s ease-in-out infinite alternate}
@media (prefers-reduced-motion:reduce){
.kora-spin,.kora-aurora,.gold-text-gradient{animation:none!important}}`

/* ---------- Briques d'animation ---------- */
const OFFSETS = { up: { y: 56 }, down: { y: -32 }, left: { x: -90 }, right: { x: 90 }, scale: { scale: 0.86, y: 28 } }

function Reveal({ children, direction = "up", delay = 0, className }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, ...OFFSETS[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >{children}</motion.div>
  )
}

// Titre révélé mot par mot
function Split({ text, className }) {
  return text.split(" ").map((w, i) => (
    <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
      <motion.span
        className={cn("inline-block", className)} initial={{ y: "110%" }} whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.06, duration: 0.7, ease: EASE }}
      >{w}&nbsp;</motion.span>
    </span>
  ))
}

function SectionHeader({ badge, title, description }) {
  return (
    <div className="mx-auto mb-16 max-w-4xl text-center lg:mb-20">
      {badge && <Reveal direction="down"><div className="mb-6">{badge}</div></Reveal>}
      <h2 className="mb-6 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">{title}</h2>
      {description && <Reveal delay={0.2}><p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">{description}</p></Reveal>}
    </div>
  )
}

function CountUp({ value, format = String }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [text, setText] = useState(() => format(0))
  useEffect(() => {
    if (!inView) return
    const c = animate(0, value, { duration: 1.5, ease: "easeOut", onUpdate: (v) => setText(format(Math.round(v))) })
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value])
  return <span ref={ref}>{text}</span>
}

function ParallaxBlob({ className, range = 160 }) {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 4000], [0, reduce ? 0 : range])
  return <motion.div aria-hidden style={{ y }} className={cn("pointer-events-none absolute rounded-full blur-3xl", className)} />
}

// Les halos colorés sont ce que le verre vient flouter : ils sont un peu plus présents
const Aurora = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="kora-aurora absolute -left-1/4 top-0 h-[60vh] w-[60vh] rounded-full bg-primary/20 blur-3xl" />
    <div className="kora-aurora absolute -right-1/4 top-1/3 h-[70vh] w-[70vh] rounded-full bg-gold/15 blur-3xl" style={{ animationDelay: "-6s" }} />
    <div className="kora-aurora absolute -bottom-1/4 left-1/4 h-[55vh] w-[55vh] rounded-full bg-primary/15 blur-3xl" style={{ animationDelay: "-12s" }} />
  </div>
)

function Cursor() {
  const reduce = useReducedMotion()
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const sx = useSpring(x, { stiffness: 140, damping: 20 })
  const sy = useSpring(y, { stiffness: 140, damping: 20 })
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer:fine) and (min-width: 1024px)").matches) return
    setOn(true)
    const m = (e) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener("pointermove", m, { passive: true })
    return () => window.removeEventListener("pointermove", m)
  }, [reduce, x, y])
  if (!on) return null
  return <motion.div aria-hidden style={{ x: sx, y: sy }} className="pointer-events-none fixed left-0 top-0 z-30 -ml-32 -mt-32 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.3 })
  return <motion.div aria-hidden style={{ scaleX }} className="gold-gradient fixed left-0 right-0 top-0 z-[60] h-1 origin-left" />
}

/* Section actuellement visible (pour surligner le lien dans la barre) */
function useActiveSection(ids) {
  const [active, setActive] = useState(null)
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -45% 0px" }
    )
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return active
}

/* Barre de navigation flottante en verre dépoli : apparaît après le hero */
function GlassNav({ links, ctaLabel, onCta, reduceMotion }) {
  const active = useActiveSection(SECTION_IDS)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3">
      <motion.nav
        aria-label="Navigation de la page"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
        className="pointer-events-auto max-w-full"
      >
        <GlassBar className="flex items-center gap-1 p-1.5">
          <div className="flex items-center gap-1">
            {links.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => scrollToSection(l.id, reduceMotion)}
                className={cn(
                  "relative rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-5 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active === l.id ? "text-foreground" : "text-foreground/60 hover:text-foreground"
                )}
              >
                {active === l.id && (
                  <motion.span layoutId="kora-nav-pill" className="absolute inset-0 rounded-full bg-foreground/10" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                )}
                <span className="relative">{l.label}</span>
              </button>
            ))}
          </div>
          <div className="hidden sm:block">
            <KButton variant="gold" size="sm" arrow onClick={onCta}>{ctaLabel}</KButton>
          </div>
        </GlassBar>
      </motion.nav>
    </div>
  )
}

function BackToTop({ label, reduceMotion }) {
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(false)
  useMotionValueEvent(scrollY, "change", (v) => setVisible(v > 700))
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 24, scale: visible ? 1 : 0.8 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      className="fixed bottom-5 right-5 z-50"
    >
      <KButton variant="glass" size="icon" aria-label={label} onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}>
        <ChevronUp className="h-5 w-5" />
      </KButton>
    </motion.div>
  )
}

// Texte qui s'allume mot par mot pendant le scroll
function ScrollWord({ word, index, total, progress }) {
  const start = (index / total) * 0.8
  const opacity = useTransform(progress, [start, start + 0.12], [0.12, 1])
  return <motion.span style={{ opacity }} className="mr-[0.28em] inline-block">{word}</motion.span>
}

function ScrollWords({ text }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] })
  const cls = "text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
  if (reduce) return <p className={cls}>{text}</p>
  const words = text.split(" ")
  return <p ref={ref} className={cls}>{words.map((w, i) => <ScrollWord key={i} word={w} index={i} total={words.length} progress={scrollYProgress} />)}</p>
}

// Halo doré qui suit la souris
function SpotlightCard({ children, className }) {
  const mx = useMotionValue(-300)
  const my = useMotionValue(-300)
  const bg = useMotionTemplate`radial-gradient(360px circle at ${mx}px ${my}px, rgba(${GOLD},0.18), transparent 70%)`
  return (
    <div
      className={cn("group relative h-full", className)}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(e.clientX - r.left); my.set(e.clientY - r.top) }}
    >
      {children}
      <motion.div aria-hidden style={{ background: bg }} className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  )
}

// Inclinaison 3D au survol
function Tilt({ children, className, max = 7 }) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [max, -max]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-max, max]), { stiffness: 200, damping: 20 })
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className} style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5) }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
    >{children}</motion.div>
  )
}

// Défilement horizontal des catégories, avec pause au survol
function Row({ cats, label, counts, locale, talents, reverse = false }) {
  const items = [...cats, ...cats]
  return (
    <div className="kora-mq py-1">
      <div className={cn("kora-marquee-track", reverse && "reverse")}>
        {items.map((cat, index) => {
          const Icon = getCategoryIcon(cat.icon)
          const name = label[cat.id] || cat.name
          const count = `${(counts[cat.id] ?? 0).toLocaleString(locale)} ${talents}`
          return (
            <Link
              key={`${cat.id}-${index}`}
              to="/categories"
              aria-label={`${name} — ${count}`}
              className="kora-marquee-item text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{name}</span>
                <span className="block text-xs text-muted-foreground">{count}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// Cartes empilées qui se réduisent progressivement pendant le défilement
function StackCard({ i, n, progress, number, Icon, title, text }) {
  const scale = useTransform(progress, [i / n, 1], [1, 1 - (n - 1 - i) * 0.05])
  return (
    <motion.article
      style={{ scale, top: `${6 + i * 18}px` }}
      className={cn("sticky mb-6 grid min-h-[280px] grid-cols-[auto_1fr] items-center gap-5 overflow-hidden rounded-3xl p-6 sm:min-h-[320px] sm:gap-10 sm:p-10", GLASS)}
    >
      <span className="select-none text-6xl font-black text-primary/30 sm:text-8xl">{number}</span>
      <div>
        <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" strokeWidth={1.7} />
        </span>
        <h3 className="mb-3 text-2xl font-black tracking-tight sm:text-4xl">{title}</h3>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{text}</p>
      </div>
    </motion.article>
  )
}

// Question de la FAQ : accordéon en verre dépoli
function FaqItem({ q, a, open, onToggle, index }) {
  return (
    <Reveal delay={index * 0.06}>
      <div className={cn("overflow-hidden rounded-3xl transition-colors duration-300", GLASS, open && "bg-foreground/[0.1]")}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-8 sm:py-6 sm:text-xl"
        >
          <span>{q}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary/15 text-primary"
          >
            <Plus className="h-5 w-5" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <p className="px-6 pb-6 text-base leading-relaxed text-muted-foreground sm:px-8 sm:pb-8 sm:text-lg">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  )
}

// Mot géant décoratif qui glisse au scroll
function BigWord() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const x = useTransform(scrollYProgress, [0, 1], ["12%", "-12%"])
  return (
    <div ref={ref} aria-hidden className="select-none overflow-hidden py-6">
      <motion.p style={{ x }} className="gold-text-gradient whitespace-nowrap text-center text-[24vw] font-black leading-none tracking-tighter opacity-25">KORA</motion.p>
    </div>
  )
}

/* ---------- Page ---------- */
export default function Landing() {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const { user } = useAuth()
  const reduce = useReducedMotion()
  const ctaRef = useRef(null)
  const [openFaq, setOpenFaq] = useState(0)
  const locale = language === "en" ? "en-GB" : "fr-FR"
  const fmt = (n) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n)
  const en = language === "en"

  useEffect(() => {
    const root = document.documentElement
    const previousScrollBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = reduce ? "auto" : "smooth"
    window.scrollTo({ top: 0, behavior: "auto" })

    return () => {
      root.style.scrollBehavior = previousScrollBehavior
    }
  }, [reduce])

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
    return () => { cancelled = true }
  }, [])

  const PLAN_DETAILS = {
    Gratuit: [1, 2, 3, 4, 5].map((n) => t(`landing.planFreeFeature${n}`)),
    Pro: [1, 2, 3, 4, 5].map((n) => t(`landing.planProFeature${n}`)),
    Business: [1, 2, 3, 4, 5].map((n) => t(`landing.planBusinessFeature${n}`)),
  }

  const planCards = ["Gratuit", "Pro", "Business"]
    .map((name) => publicPlans.find((plan) => plan.name === name))
    .filter(Boolean)
    .map((plan) => ({
      ...plan,
      displayName: plan.name === "Gratuit" ? t("landing.planFreeName") : plan.name === "Pro" ? t("landing.planProName") : t("landing.planBusinessName"),
      description: plan.name === "Gratuit" ? t("landing.planFreeDescription") : plan.name === "Pro" ? t("landing.planProDescription") : t("landing.planBusinessDescription"),
      featureList: PLAN_DETAILS[plan.name] || [],
      highlighted: plan.name === "Pro",
      period: plan.name === "Gratuit" ? "" : t("landing.perMonth"),
    }))

  const handlePlanSelection = (plan) => {
    const planId = String(plan?.id || "").toUpperCase()
    if (planId === "FREE") { navigate("/register?role=manager"); return }
    if (!["PRO", "BUSINESS"].includes(planId)) return
    if (user?.role === "manager") { navigate(`/manager/subscription?checkout=${planId}`); return }
    if (user) { toast.error(t("landing.managerAccountRequired")); return }
    try {
      sessionStorage.setItem("kora_pending_subscription_plan", planId)
    } catch {
      // Le plan est aussi transmis dans l'URL d'inscription.
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

  const cats = APP_PARAMS.categories
  const half = Math.ceil(cats.length / 2)
  const rows = [
    cats.slice(0, half),
    cats.slice(half).concat(cats.length > 1 ? [] : cats),
  ]

  const features = [
    [Shield, "Profiles"], [Zap, "Search"], [TrendingUp, "Subscription"],
    [Target, "Collaboration"], [Award, "Published"], [Rocket, "Workspace"],
  ].map(([icon, k]) => ({ icon, title: t(`landing.feature${k}Title`), description: t(`landing.feature${k}Description`) }))
  const spans = ["lg:col-span-2 lg:row-span-2", "", "", "", "", "sm:col-span-2 lg:col-span-4"]

  const steps = [Users, Target, Briefcase].map((Icon, i) => ({
    Icon,
    number: `0${i + 1}`,
    title: t(`landing.processStep${i + 1}Title`),
    text: t(`landing.processStep${i + 1}Description`),
  }))

  const stackRef = useRef(null)
  const {
    scrollYProgress: stackProgress
  } = useScroll({
    target: stackRef,
    offset: ["start start", "end end"],
  })

  const navLinks = [
    { id: "categories", label: en ? "Categories" : "Catégories" },
    { id: "pricing", label: en ? "Pricing" : "Abonnement" },
    { id: "faq", label: "FAQ" },
  ]

  // Textes de la FAQ : modifie-les librement pour coller à ton offre
  const faqItems = en
    ? [
        { q: "How does KORA work?", a: "KORA connects managers with talents. You browse the categories, discover profiles, then get in touch to start collaborating." },
        { q: "Can I start for free?", a: "Yes, a free plan is available. Create your manager account to get started." },
        { q: "What is the difference between the plans?", a: "Each plan (Free, Pro, Business) unlocks more features. The details are in the Pricing section above." },
        { q: "How do I subscribe?", a: "Sign in with a manager account, choose the Pro or Business plan, then complete the checkout. If you don’t have an account yet, you will be invited to create one." },
        { q: "Which categories can I find talents in?", a: "Music, fashion, sport, cinema, gastronomy and many more. Browse the Categories section to see them all." },
      ]
    : [
        { q: "Comment fonctionne KORA ?", a: "KORA met en relation des managers et des talents. Vous parcourez les catégories, découvrez les profils, puis vous prenez contact pour collaborer." },
        { q: "Puis-je commencer gratuitement ?", a: "Oui, un plan Gratuit est proposé. Créez votre compte manager pour commencer." },
        { q: "Quelle est la différence entre les plans ?", a: "Chaque plan (Gratuit, Pro, Business) débloque davantage de fonctionnalités. Le détail se trouve dans la section Abonnement ci-dessus." },
        { q: "Comment souscrire à un abonnement ?", a: "Connectez-vous avec un compte manager, choisissez le plan Pro ou Business, puis finalisez le paiement. Si vous n’avez pas encore de compte, il vous sera proposé d’en créer un." },
        { q: "Dans quelles catégories trouver des talents ?", a: "Musique, mode, sport, cinéma, gastronomie et bien d’autres. Parcourez la section Catégories pour toutes les voir." },
      ]

  const { scrollYProgress: ctaProgress } = useScroll({ target: ctaRef, offset: ["start end", "center center"] })
  const ctaScale = useTransform(ctaProgress, [0, 1], [reduce ? 1 : 0.86, 1])
  const ctaRadius = useTransform(ctaProgress, [0, 1], [reduce ? 40 : 120, 40])

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col kora-public-shell">
        <style>{CSS}</style>
        <Aurora />
        <Cursor />
        <ScrollProgress />
        <GlassNav links={navLinks} ctaLabel={t("landing.startFree")} onCta={() => navigate("/register?role=manager")} reduceMotion={reduce} />
        <BackToTop label={en ? "Back to top" : "Retour en haut"} reduceMotion={reduce} />

        <main className="relative z-10">
          <LandingHero />
          <LandingEvolution stats={stats} language={language} />

          {/* Parcours simple : cartes empilées animées au défilement */}
          <section id="how-it-works" className="kora-process-section py-24 lg:py-32">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <SectionHeader
                badge={<GlassBar className="inline-flex px-5 py-2"><span className="kora-hero-eyebrow">{t("landing.processEyebrow")}</span></GlassBar>}
                title={<Split text={en ? "From discovery to collaboration" : "De la recherche à la collaboration"} />}
                description={t("landing.processDescription")}
              />
              <div ref={stackRef} className="pb-[15vh]">
                {steps.map((step, i) => (
                  <StackCard
                    key={step.number}
                    i={i}
                    n={steps.length}
                    progress={stackProgress}
                    {...step}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Catégories : deux rangées défilantes avec animation */}
          <section id="categories" className="overflow-hidden py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeader
                badge={<Badge variant="default" className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider">{t("landing.categoriesEyebrow")}</Badge>}
                title={<><Split text={`${cats.length} ${t("landing.categoriesTitle")}`} /><Split text={t("landing.categoriesTitleEmphasis")} className="gold-text-gradient" /></>}
                description={t("landing.categoriesDescription")}
              />
            </div>
            <div className="kora-mq space-y-5">
              <Row
                cats={rows[0]}
                label={categoryLabels}
                counts={categoryCounts}
                locale={locale}
                talents={t("landing.talentsCount")}
              />
              {rows[1].length > 0 && (
                <Row
                  cats={rows[1]}
                  label={categoryLabels}
                  counts={categoryCounts}
                  locale={locale}
                  talents={t("landing.talentsCount")}
                  reverse
                />
              )}
            </div>
          </section>

          {/* Pourquoi KORA : manifeste + bento en verre */}
          <section id="why-kora" className="relative overflow-hidden py-28 lg:py-40">
            <ParallaxBlob className="-left-32 bottom-10 h-96 w-96 bg-accent/40" range={120} />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto mb-24 max-w-5xl text-center lg:mb-32">
                <Reveal direction="down">
                  <Badge variant="gold" className="mb-8 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">{en ? "WHY KORA?" : "POURQUOI KORA ?"}</Badge>
                </Reveal>
                <h2 className="mb-10 text-6xl font-black leading-none tracking-tight sm:text-7xl lg:text-8xl">
                  <Split text={en ? "Why" : "Pourquoi"} /><Split text={en ? "KORA?" : "KORA ?"} className="gold-text-gradient" />
                </h2>
                <ScrollWords text={en ? "A platform designed to make talent discovery and professional collaborations easier." : "Une plateforme pensée pour faciliter la découverte des talents et les collaborations professionnelles."} />
              </div>

              <div className="grid auto-rows-[minmax(14rem,auto)] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {features.map(({ icon: Icon, title, description }, i) => {
                  const big = i === 0
                  return (
                    <Reveal key={title} direction={i % 2 === 0 ? "left" : "right"} delay={(i % 3) * 0.1} className={spans[i]}>
                      <SpotlightCard className="rounded-3xl">
                        <Card className={cn("relative h-full overflow-hidden rounded-3xl transition-transform duration-300 hover:-translate-y-1", GLASS)}>
                          {big && <Icon aria-hidden className="absolute -bottom-10 -right-10 h-72 w-72 text-primary opacity-[0.08]" strokeWidth={1} />}
                          <CardContent className={cn("relative flex h-full flex-col justify-end", big ? "p-10 lg:p-12" : "p-7", i === 5 && "sm:p-10")}>
                            <motion.div
                              animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                              className="mb-auto w-fit"
                            >
                              <GlassBar className={cn("grid place-items-center text-primary transition-transform duration-300 group-hover:scale-110", big ? "h-20 w-20 rounded-3xl" : "h-14 w-14 rounded-2xl")}>
                                <Icon className={big ? "h-10 w-10" : "h-7 w-7"} strokeWidth={2} />
                              </GlassBar>
                            </motion.div>
                            <h3 className={cn("mb-3 mt-8 font-black tracking-tight", big ? "text-3xl lg:text-4xl" : "text-xl")}>{title}</h3>
                            <p className={cn("leading-relaxed text-muted-foreground", big && "text-lg")}>{description}</p>
                          </CardContent>
                        </Card>
                      </SpotlightCard>
                    </Reveal>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Tarifs : cartes en verre, bordure dorée animée sur le plan Pro */}
          <section id="pricing" className="relative overflow-hidden py-28 lg:py-40">
            <ParallaxBlob className="-right-24 top-20 h-96 w-96 bg-primary/10" range={-120} />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeader
                badge={<Badge variant="default" className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider">{t("landing.pricingEyebrow")}</Badge>}
                title={<><Split text={t("landing.pricingTitle")} /><Split text={t("landing.pricingTitleEmphasis")} className="gold-text-gradient" /></>}
              />
              <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-8 md:grid-cols-3">
                {landingDataLoading ? (
                  [0, 1, 2].map((k) => <div key={k} className={cn("h-[28rem] animate-pulse rounded-3xl", GLASS)} />)
                ) : planCards.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground md:col-span-3">{t("landing.unavailablePlans")}</div>
                ) : (
                  planCards.map((plan, i) => {
                    const price = Number(plan.price)
                    return (
                      <Reveal key={plan.name} direction={["left", "scale", "right"][i] || "up"} delay={i * 0.12} className="h-full">
                        <Tilt className={cn("relative h-full", plan.highlighted && "md:z-10 md:scale-[1.06]")}>
                          {plan.highlighted && (
                            <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
                              <motion.div
                                animate={reduce ? undefined : { scale: [1, 1.07, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                className="gold-gradient rounded-full px-4 py-1.5 text-xs font-black text-primary-foreground shadow-lg shadow-gold/30"
                              >{t("landing.mostPopular")}</motion.div>
                            </div>
                          )}
                          <div className={cn("relative h-full overflow-hidden rounded-3xl", plan.highlighted && "p-[2px] shadow-2xl shadow-gold/20")}>
                            {plan.highlighted && (
                              <span
                                aria-hidden className="kora-spin absolute -inset-[60%]"
                                style={{ background: `conic-gradient(from 0deg, transparent 0 55%, rgba(${GOLD},1) 80%, rgba(245,224,138,1) 90%, transparent 100%)`, animation: "kora-spin 4s linear infinite" }}
                              />
                            )}
                            {/* Le plan Pro garde un fond plus opaque pour masquer la bordure qui tourne derrière */}
                            <Card className={cn("relative h-full rounded-[calc(1.5rem-2px)]", GLASS, plan.highlighted && "bg-background/85")}>
                              <CardContent className="p-8">
                                <div className="mb-6">
                                  <h3 className="mb-2 text-2xl font-black">{plan.displayName}</h3>
                                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                                </div>
                                <div className="mb-6 border-b border-foreground/10 pb-6">
                                  <div className="flex items-baseline gap-1">
                                    <span className="gold-text-gradient text-6xl font-black">{price > 0 ? <CountUp value={price} format={fmt} /> : t("landing.planFreeName")}</span>
                                    {plan.period && <span className="text-sm font-semibold text-muted-foreground">{plan.period}</span>}
                                  </div>
                                </div>
                                <ul className="mb-8 space-y-3">
                                  {plan.featureList.map((f, idx) => (
                                    <motion.li
                                      key={f} initial={reduce ? false : { opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                      transition={{ duration: 0.45, delay: 0.3 + idx * 0.08, ease: EASE }} className="flex items-start gap-3"
                                    >
                                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                      <span className="text-sm text-foreground/90">{f}</span>
                                    </motion.li>
                                  ))}
                                </ul>
                                {/* Le wrapper force le bouton à prendre toute la largeur */}
                                <div className="[&>div]:flex [&>div]:w-full">
                                  <KButton
                                    variant={plan.highlighted ? "gold" : "glass"}
                                    size="lg"
                                    arrow
                                    className="w-full"
                                    onClick={() => handlePlanSelection(plan)}
                                  >
                                    {plan.name === "Pro" ? t("landing.choosePro") : plan.name === "Business" ? t("landing.activateBusiness") : t("landing.startFree")}
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
            </div>
          </section>

          {/* FAQ : accordéon en verre dépoli */}
          <section id="faq" className="relative overflow-hidden py-28 lg:py-40">
            <ParallaxBlob className="-left-24 top-24 h-80 w-80 bg-primary/10" range={100} />
            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <SectionHeader
                badge={<Badge variant="default" className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider">FAQ</Badge>}
                title={<Split text={en ? "Frequently asked questions" : "Questions fréquentes"} />}
                description={en ? "Everything you need to know before getting started." : "Tout ce qu’il faut savoir avant de commencer."}
              />
              <div className="space-y-4">
                {faqItems.map((f, i) => (
                  <FaqItem key={f.q} index={i} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
                ))}
              </div>
            </div>
          </section>

          {/* CTA final : panneau doré qui grandit, avec un grand verre dépoli au centre */}
          <section ref={ctaRef} className="relative px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
            <motion.div style={{ scale: ctaScale, borderRadius: ctaRadius }} className="gold-gradient relative mx-auto max-w-6xl overflow-hidden px-4 py-16 text-center text-primary-foreground sm:px-10 sm:py-24">
              {["-left-16 -top-16 h-64 w-64", "right-10 top-1/2 h-40 w-40", "-bottom-20 left-1/3 h-72 w-72"].map((pos, i) => (
                <motion.span
                  key={pos} aria-hidden
                  animate={reduce ? undefined : { y: [0, -24, 0], x: [0, i % 2 ? -16 : 16, 0] }} transition={{ duration: 7 + i * 2, repeat: Infinity, ease: "easeInOut" }}
                  className={cn("pointer-events-none absolute rounded-full bg-white/30 blur-2xl", pos)}
                />
              ))}
              <GlassBar className="relative mx-auto max-w-4xl rounded-[2.5rem] border-white/30 bg-white/15 px-6 py-14 sm:px-12 sm:py-20">
                <Reveal direction="scale">
                  <h2 className="mx-auto mb-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                    {en ? "Ready to meet tomorrow’s talent?" : "Prêt à rencontrer les talents de demain ?"}
                  </h2>
                </Reveal>
                <Reveal delay={0.15}>
                  <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed opacity-90 sm:text-xl">
                    {en ? "Create your free account and start collaborating today." : "Créez votre compte gratuit et commencez à collaborer dès aujourd’hui."}
                  </p>
                </Reveal>
                <Reveal delay={0.3}>
                  <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <KButton variant="glass" size="lg" arrow magnetic className="bg-background text-foreground hover:bg-background/90" onClick={() => navigate("/register?role=manager")}>
                      {t("landing.startFree")}
                    </KButton>
                    <KButton variant="glass" size="lg" magnetic className="border-white/40 text-primary-foreground hover:bg-white/20" onClick={() => scrollToSection("categories", reduce)}>
                      {t("landing.categoriesEyebrow")}
                    </KButton>
                  </div>
                </Reveal>
              </GlassBar>
            </motion.div>
          </section>

        </main>

        <footer className="relative z-10">
          <LandingFooter />
          <BigWord />
        </footer>
      </div>
    </MotionConfig>
  )
}