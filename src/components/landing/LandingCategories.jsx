import { Link } from "react-router-dom"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { Reveal, SectionHeader } from "./landingKit.jsx"

export default function LandingCategories() {
  const { t } = useI18n()
  const cats = APP_PARAMS.categories
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
          <div className="kora-lp-category-grid">
            {cats.map((category) => {
              const Icon = getCategoryIcon(category.icon)
              const label = labels[category.id] || category.name
              return (
                <Link key={category.id} to="/categories" className="kora-lp-category-card">
                  <span className="kora-lp-category-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="font-bold">{label}</span>
                </Link>
              )
            })}
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
