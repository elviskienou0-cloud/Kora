import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"
import { Reveal, SectionHeader } from "./landingKit.jsx"

export default function LandingCategories() {
  const { t } = useI18n()
  const [cats, setCats] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, slug, name, icon")
          .eq("is_active", true)
          .order("name", { ascending: true })
        if (error) throw error
        if (mounted) setCats(data || [])
      } catch (error) {
        if (mounted) {
          console.error("Erreur chargement catégories landing :", error)
          setCats([])
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [])
  const labels = {
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

  return (
    <section id="categories" className="kora-lp-section" aria-labelledby="categories-title">
      <div className="kora-lp-container">
        <SectionHeader
          titleId="categories-title"
          eyebrow={t("landing.categoriesEyebrow")}
          title={t("landing.categoriesTitle")}
          emphasis={t("landing.categoriesTitleEmphasis")}
          description={t("landing.categoriesDescription")}
        />

        <Reveal>
          <div className="kora-lp-category-grid-scroll" role="region" aria-label={t("landing.categoriesTitle")} tabIndex={0}>
            <div className="kora-lp-category-grid kora-lp-category-grid-two-rows" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(cats.length / 2))}, minmax(165px, 1fr))` }}>
            {cats.map((category) => {
              const Icon = getCategoryIcon(category.icon || APP_PARAMS.categories.find((item) => item.id === category.slug)?.icon)
              const label = labels[category.slug] || category.name
              return (
                <Link key={category.id} to={`/categories?category=${encodeURIComponent(category.slug)}`} className="kora-lp-category-card">
                  <span className="kora-lp-category-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="font-bold">{label}</span>
                </Link>
              )
            })}
            </div>
          </div>
        </Reveal>

        <div className="mt-8 flex justify-center">
          <Link to="/categories" className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t("landing.categoriesCta")}
          </Link>
        </div>
      </div>
    </section>
  )
}
