import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { KButton } from "@/components/ui/KButton"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"

const CATEGORY_KEYS = {
  music:"landing.categoryMusic", fashion:"landing.categoryFashion", influence:"landing.categoryInfluence",
  sport:"landing.categorySport", events:"landing.categoryEvents", culture:"landing.categoryCulture",
  cinema:"landing.categoryCinema", voice:"landing.categoryVoice", comedy:"landing.categoryComedy",
  beauty:"landing.categoryBeauty", gastronomy:"landing.categoryGastronomy",
}

export default function LandingHero() {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const heroRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const [categories, setCategories] = useState([])
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const translatedCategories = useMemo(() => categories.map((category) => ({
    ...category, label: CATEGORY_KEYS[category.slug] ? t(CATEGORY_KEYS[category.slug]) : category.name,
  })), [categories, t, language])
  const activeCategory = translatedCategories[activeIndex] || translatedCategories[0]
  const floatingCategories = translatedCategories.length > 3
    ? [translatedCategories[2], translatedCategories[Math.floor(translatedCategories.length / 2)], translatedCategories[translatedCategories.length - 1]]
    : translatedCategories

  useEffect(() => {
    let mounted = true
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, slug, name, icon")
          .eq("is_active", true)
          .order("name", { ascending: true })
        if (error) throw error
        if (mounted) setCategories(data || [])
      } catch (error) {
        if (mounted) {
          console.error("Erreur chargement catégories du hero :", error)
          setCategories([])
        }
      }
    }
    loadCategories()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const element = heroRef.current
    if (!element || !("IntersectionObserver" in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: .15 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reduceMotion || !autoRotate || translatedCategories.length < 2) return undefined
    const timer = window.setInterval(() => {
      if (isVisible && document.visibilityState === "visible") setActiveIndex((index) => (index + 1) % translatedCategories.length)
    }, 2800)
    return () => window.clearInterval(timer)
  }, [autoRotate, translatedCategories.length, isVisible, reduceMotion])

  return (
    <section ref={heroRef} className="kora-landing-hero kora-spotlight-hero" aria-labelledby="kora-hero-title">
      <div className="kora-spotlight-beams" aria-hidden="true"><i /><i /><i /></div>
      <div className="kora-spotlight-orbit kora-spotlight-orbit-one" aria-hidden="true" />
      <div className="kora-spotlight-orbit kora-spotlight-orbit-two" aria-hidden="true" />
      {floatingCategories.map((category, index) => {
        const Icon = getCategoryIcon(category.icon || APP_PARAMS.categories.find((item) => item.id === category.slug)?.icon)
        return <div className={"kora-spotlight-float kora-spotlight-float-" + index} key={category.id} aria-hidden="true">
          <span className="kora-spotlight-float-icon"><Icon size={18} /></span>
          <span className="kora-spotlight-float-copy"><strong>{category.label}</strong><small>{language === "en" ? "Talent universe" : "Univers de talents"}</small></span>
          <span className="kora-spotlight-float-mark"><Sparkles size={14} /></span>
        </div>
      })}
      <div className="kora-spotlight-hero-content">
        <p className="kora-spotlight-pill"><span />{t("landing.heroEyebrow")}</p>
        <h1 id="kora-hero-title">
          {language === "en" ? "Find the right talent in" : "Dénichez le talent côté"}
          <span className="kora-spotlight-word" aria-live="off" key={activeCategory?.id || "kora"}>
            {activeCategory?.label || (language === "en" ? "your next project" : "talents")}
          </span>
        </h1>
        <p className="kora-hero-description">{t("landing.heroDescription")}</p>
        <div className="kora-spotlight-actions">
          <KButton size="lg" arrow onClick={() => navigate("/categories")} className="kora-spotlight-primary">{t("landing.discoverTalents")}</KButton>
          <Link to="/register?role=manager" className="kora-spotlight-secondary">{t("landing.audienceManagerCta")} <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className="kora-spotlight-proof" aria-label={language === "en" ? "KORA platform benefits" : "Atouts de la plateforme KORA"}>
          <span><CheckCircle2 aria-hidden="true" />{language === "en" ? "Profiles managed by managers" : "Profils gérés par des managers"}</span>
          <span><CheckCircle2 aria-hidden="true" />{language === "en" ? "Structured requests" : "Demandes structurées"}</span>
          <span><CheckCircle2 aria-hidden="true" />{language === "en" ? "Client and manager spaces" : "Espaces client et manager"}</span>
        </div>
        <div className="kora-spotlight-picker-wrap">
          <p>{language === "en" ? "Explore a talent universe" : "Explorez un univers de talents"}</p>
          <div className="kora-spotlight-picker" role="group" aria-label={language === "en" ? "Choose a category" : "Choisir une catégorie"}>
            {translatedCategories.map((category, index) => <button key={category.id} type="button" onClick={() => { setAutoRotate(false); setActiveIndex(index) }} aria-pressed={activeIndex === index}>{category.label}</button>)}
          </div>
        </div>
      </div>
    </section>
  )
}
