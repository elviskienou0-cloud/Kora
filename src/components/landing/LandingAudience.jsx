import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Briefcase, CheckCircle2, Search } from "lucide-react"
import { KButton } from "@/components/ui/KButton"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { Reveal, SectionHeader } from "./landingKit.jsx"

function Points({ items, dark = false }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <CheckCircle2 className={dark ? "mt-0.5 h-5 w-5 shrink-0 text-amber-300" : "mt-0.5 h-5 w-5 shrink-0 text-emerald-600"} aria-hidden="true" />
          <span className={dark ? "text-base font-semibold leading-relaxed text-white/90" : "text-base font-semibold leading-relaxed text-foreground/90"}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function LandingAudience() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const clientPoints = [
    t("landing.audienceClientPoint1"),
    t("landing.audienceClientPoint2"),
    t("landing.audienceClientPoint3"),
  ]
  const managerPoints = [
    t("landing.audienceManagerPoint1"),
    t("landing.audienceManagerPoint2"),
    t("landing.audienceManagerPoint3"),
  ]

  return (
    <section id="audience" className="kora-lp-section" aria-labelledby="audience-title">
      <div className="kora-lp-container">
        <SectionHeader
          titleId="audience-title"
          eyebrow={t("landing.audienceEyebrow")}
          title={t("landing.audienceTitle")}
          emphasis={t("landing.audienceTitleEmphasis")}
          description={t("landing.audienceDescription")}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal className="h-full">
            <article className="kora-lp-audience-card kora-lp-audience-card-client h-full">
              <span className="kora-lp-audience-tag">{t("landing.audienceClientTag")}</span>
              <span className="kora-lp-audience-icon"><Search className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="kora-lp-card-title">{t("landing.audienceClientTitle")}</h3>
              <p className="kora-lp-body mt-3">{t("landing.audienceClientText")}</p>
              <Points items={clientPoints} />
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-7">
                <KButton size="lg" arrow onClick={() => navigate("/categories")}>{t("landing.audienceClientCta")}</KButton>
                <Link to="/register?role=client" className="inline-flex min-h-12 items-center gap-1.5 text-sm font-bold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {t("landing.audienceClientSecondary")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          </Reveal>

          <Reveal className="h-full" delay={0.08}>
            <article className="kora-lp-audience-card kora-lp-audience-card-manager h-full">
              <span className="kora-lp-audience-tag">{t("landing.audienceManagerTag")}</span>
              <span className="kora-lp-audience-icon"><Briefcase className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="kora-lp-card-title">{t("landing.audienceManagerTitle")}</h3>
              <p className="kora-lp-body mt-3">{t("landing.audienceManagerText")}</p>
              <Points items={managerPoints} dark />
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-7">
                <KButton size="lg" onClick={() => navigate("/register?role=manager")}>{t("landing.audienceManagerCta")}</KButton>
                <button
                  type="button"
                  onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
                  className="inline-flex min-h-12 items-center gap-1.5 text-sm font-bold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {t("landing.audienceManagerSecondary")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
