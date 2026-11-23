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
import { BackToTop } from "@/components/landing/LandingEffects.jsx"
import { useKoraStats } from "@/lib/useKoraStats"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import "@/styles/landing-v2.css"

const STAT_META = [
  { key: "landing.statsTalents", icon: Users, index: 0 },
  { key: "landing.statsCountries", icon: Globe, index: 2 },
  { key: "landing.statsSatisfaction", icon: Star, index: 3 },
]

export default function Landing() {
  const { t, language, setLanguage } = useI18n()
  const reduce = useReducedMotion()
  const { stats: liveStats, loading: statsLoading } = useKoraStats({ realtime: false })

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.scrollBehavior
    root.style.scrollBehavior = reduce ? "auto" : "smooth"
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "auto" })
    return () => { root.style.scrollBehavior = previous }
  }, [reduce])

  const stats = useMemo(
    () => STAT_META.map((meta) => ({
      ...(liveStats[meta.index] || { value: "—" }),
      label: t(meta.key),
      icon: meta.icon,
    })),
    [liveStats, t, language]
  )

  const navLinks = [
    { id: "how-it-works", label: t("landing.navHow") },
    { id: "categories", label: t("landing.navCategories") },
    { id: "community", label: t("landing.navCommunity") },
    { id: "why-kora", label: t("landing.navWhy") },
    { id: "pricing", label: t("landing.navPricing") },
    { id: "faq", label: t("landing.navFaq") },
  ]

  const navLabels = {
    aria: t("landing.navAria"),
    login: t("landing.navLogin"),
    start: t("landing.discoverTalents"),
    startShort: t("landing.getStarted"),
    manager: t("landing.audienceManagerCta"),
    openMenu: t("landing.openMenu"),
    closeMenu: t("landing.closeMenu"),
  }

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="kora-public-shell kora-lp relative flex min-h-screen flex-col">
        <LandingNav
          links={navLinks}
          labels={navLabels}
          language={language}
          onLanguageChange={() => setLanguage(language === "fr" ? "en" : "fr")}
        />
        <BackToTop label={t("landing.backToTop")} />

        <main className="relative z-10">
          <LandingHero />
          <LandingAudience />
          <LandingProcess />
          <LandingCategories />
          <LandingEvolution stats={stats} loading={statsLoading} />
          <LandingWhy />
          <LandingPricing />
          <LandingFaq />
          <LandingFinalCta />
        </main>

        <LandingFooter />
      </div>
    </MotionConfig>
  )
}
