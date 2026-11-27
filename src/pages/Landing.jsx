import { useEffect } from "react"
import LandingHero from "@/components/landing/LandingHero"
import LandingFooter from "@/components/landing/LandingFooter"
import LandingNav from "@/components/landing/LandingNav"
import LandingProcess from "@/components/landing/LandingProcess"
import LandingManifesto from "@/components/landing/LandingManifesto"
import LandingCategories from "@/components/landing/LandingCategories"
import LandingWhy from "@/components/landing/LandingWhy"
import LandingPricing from "@/components/landing/LandingPricing"
import LandingOrientation from "@/components/landing/LandingOrientation"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import "@/styles/landing-v2.css"
import "@/styles/landing-motion.css"
import "@/styles/landing-refresh.css"
import "@/styles/landing-spotlight.css"
import "@/styles/landing-final.css"

export default function Landing() {
  const { t, language, setLanguage } = useI18n()

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.scrollBehavior
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    root.style.scrollBehavior = reduce ? "auto" : "smooth"
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "auto" })
    return () => { root.style.scrollBehavior = previous }
  }, [])

  useEffect(() => {
    const meta = {
      fr: {
        title: "KORA | Découvrez les talents africains et collaborez avec leurs managers",
        description: "Découvrez des profils de talents africains, contactez leurs managers et suivez vos demandes et collaborations sur KORA.",
      },
      en: {
        title: "KORA | Discover African talent and collaborate with their managers",
        description: "Explore African talent profiles, contact their managers, and follow requests and collaborations on KORA.",
      },
    }[language]
    const previousTitle = document.title
    const descriptionTag = document.querySelector('meta[name="description"]')
    const previousDescription = descriptionTag?.content
    document.title = meta.title
    if (descriptionTag) descriptionTag.content = meta.description
    return () => {
      document.title = previousTitle
      if (descriptionTag && previousDescription) descriptionTag.content = previousDescription
    }
  }, [language])

  const navLinks = [
    { id: "categories", label: t("landing.navCategories") },
    { id: "pricing", label: t("landing.navPricing") },
  ]
  const navLabels = {
    aria: t("landing.navAria"),
    login: t("landing.navLogin"),
    start: t("account.register"),
    startShort: t("account.register"),
    manager: t("landing.audienceManagerCta"),
    openMenu: t("landing.openMenu"),
    closeMenu: t("landing.closeMenu"),
  }

  return (
    <div id="top" className="kora-public-shell kora-lp relative flex min-h-screen flex-col">
      <LandingNav
        links={navLinks}
        labels={navLabels}
        language={language}
        onLanguageChange={() => setLanguage(language === "fr" ? "en" : "fr")}
      />
      <main className="relative z-10">
        <LandingHero />
        <LandingManifesto />
        <LandingProcess />
        <LandingCategories />
        <LandingWhy />
        <LandingPricing />
        <LandingOrientation />
      </main>
      <LandingFooter />
    </div>
  )
}
