import { useEffect, useMemo } from "react"
import { MotionConfig, useReducedMotion } from "framer-motion"
import { Briefcase, Globe, Star, Users } from "lucide-react"
import LandingHero from "@/components/landing/LandingHero"
import LandingEvolution from "@/components/landing/LandingEvolution.jsx"
import LandingFooter from "@/components/landing/LandingFooter"
import LandingNav from "@/components/landing/LandingNav.jsx"
import LandingAudience from "@/components/landing/LandingAudience.jsx"
import LandingProcess from "@/components/landing/LandingProcess.jsx"
import LandingCategories from "@/components/landing/LandingCategories.jsx"
import LandingWhy from "@/components/landing/LandingWhy.jsx"
import LandingPricing from "@/components/landing/LandingPricing.jsx"
import LandingFaq from "@/components/landing/LandingFaq.jsx"
import LandingFinalCta from "@/components/landing/LandingFinalCta.jsx"
import { Aurora, BackToTop, BigWord, CursorGlow, ScrollProgress } from "@/components/landing/LandingEffects.jsx"
import { LiteProvider, useLiteMode } from "@/components/landing/landingKit.jsx"
import { useKoraStats } from "@/lib/useKoraStats"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import "@/styles/landing-v2.css"

/* useKoraStats renvoie toujours 4 valeurs dans cet ordre : talents, projets, pays, satisfaction.
   On les associe par position (et non par libellé français) pour que les étiquettes traduites restent justes. */
const STAT_META = [
  { key: "landing.statsTalents", icon: Users },
  { key: "landing.statsProjects", icon: Briefcase },
  { key: "landing.statsCountries", icon: Globe },
  { key: "landing.statsSatisfaction", icon: Star },
]

export default function Landing() {
  const { t, language, setLanguage } = useI18n()
  const reduce = useReducedMotion()
  const lite = useLiteMode()
  const { stats: liveStats, categoryCounts } = useKoraStats()

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (!hash) window.scrollTo({ top: 0, behavior: "instant" })
    const root = document.documentElement
    const previous = root.style.scrollBehavior
    root.style.scrollBehavior = reduce ? "auto" : "smooth"
    return () => { root.style.scrollBehavior = previous }
  }, [reduce])

  const stats = useMemo(
    () => STAT_META.map((meta, i) => ({ ...(liveStats[i] || { value: "0" }), label: t(meta.key), icon: meta.icon })),
    [liveStats, language]
  )

  const navLinks = [
    { id: "how-it-works", label: t("landing.navHow") },
    { id: "categories", label: t("landing.navCategories") },
    { id: "why-kora", label: t("landing.navWhy") },
    { id: "pricing", label: t("landing.navPricing") },
    { id: "faq", label: t("landing.navFaq") },
  ]
  const navLabels = {
    aria: t("landing.navAria"),
    login: t("landing.navLogin"),
    start: t("landing.startFree"),
    startShort: t("landing.getStarted"),
  }

  return (
    <MotionConfig reducedMotion="user">
      <LiteProvider value={lite}>
        <div id="top" className="kora-public-shell kora-lp relative flex min-h-screen flex-col">
          <Aurora />
          <CursorGlow />
          <ScrollProgress />
          <LandingNav
            links={navLinks}
            labels={navLabels}
            language={language}
            onLanguageChange={() => setLanguage(language === "fr" ? "en" : "fr")}
          />
          <BackToTop label={t("landing.backToTop")} />

          <main className="relative z-10">
            <LandingHero />
            <LandingEvolution stats={stats} language={language} />
            <LandingAudience />
            <LandingProcess />
            <LandingCategories counts={categoryCounts} />
            <LandingWhy />
            <LandingPricing />
            <LandingFaq />
            <LandingFinalCta />
          </main>

          <footer className="relative z-10">
            <LandingFooter />
            <BigWord />
          </footer>
        </div>
      </LiteProvider>
    </MotionConfig>
  )
}
