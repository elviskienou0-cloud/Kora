import { Link, useNavigate } from "react-router-dom"
import { KButton } from "@/components/ui/KButton"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { cn } from "@/lib/utils"
import { Reveal, SectionHeader } from "./landingKit.jsx"

function MarqueeRow({ cats, labels, counts, locale, talents, reverse = false }) {
  const items = [...cats, ...cats]
  return (
    <div className="kora-lp-marquee py-1.5">
      <div className={cn("kora-lp-marquee-track", reverse && "is-reverse")}>
        {items.map((cat, index) => {
          const Icon = getCategoryIcon(cat.icon)
          const name = labels[cat.id] || cat.name
          const count = `${(counts[cat.id] ?? 0).toLocaleString(locale)} ${talents}`
          const duplicate = index >= cats.length
          return (
            <Link
              key={`${cat.id}-${index}`}
              to="/categories"
              aria-label={`${name} — ${count}`}
              aria-hidden={duplicate || undefined}
              tabIndex={duplicate ? -1 : undefined}
              className="kora-lp-chip text-foreground"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-dark">
                <Icon className="h-6 w-6" strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.95rem] font-extrabold tracking-tight">{name}</span>
                <span className="kora-lp-num block text-xs font-semibold text-muted-foreground">{count}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function LandingCategories({ counts }) {
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const locale = language === "en" ? "en-GB" : "fr-FR"
  const cats = APP_PARAMS.categories
  const labels = {
    music: t("landing.categoryMusic"), fashion: t("landing.categoryFashion"),
    influence: t("landing.categoryInfluence"), sport: t("landing.categorySport"),
    events: t("landing.categoryEvents"), culture: t("landing.categoryCulture"),
    cinema: t("landing.categoryCinema"), voice: t("landing.categoryVoice"),
    comedy: t("landing.categoryComedy"), beauty: t("landing.categoryBeauty"),
    gastronomy: t("landing.categoryGastronomy"),
  }
  const half = Math.ceil(cats.length / 2)
  const common = { labels, counts, locale, talents: t("landing.talentsCount") }

  return (
    <section id="categories" className="kora-lp-section overflow-hidden" aria-labelledby="categories-title">
      <div className="kora-lp-container">
        <SectionHeader
          titleId="categories-title"
          eyebrow={t("landing.categoriesEyebrow")}
          title={`${cats.length} ${t("landing.categoriesTitle")}`}
          emphasis={t("landing.categoriesTitleEmphasis")}
          description={t("landing.categoriesDescription")}
        />
      </div>
      <div className="space-y-3" style={{ maxWidth: "none" }}>
        <MarqueeRow cats={cats.slice(0, half)} {...common} />
        {cats.length > half && <MarqueeRow cats={cats.slice(half)} {...common} reverse />}
      </div>
      <Reveal className="mt-10 flex justify-center">
        <KButton variant="glass" size="lg" arrow onClick={() => navigate("/categories")}>{t("landing.categoriesCta")}</KButton>
      </Reveal>
    </section>
  )
}
