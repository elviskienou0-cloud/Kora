import { Link, useNavigate } from "react-router-dom"
import { KButton } from "@/components/ui/KButton"
import { useI18n } from "@/i18n/kora-i18n.jsx"

export default function LandingFinalCta() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <section className="kora-lp-section kora-lp-final-section" aria-labelledby="final-cta-title">
      <div className="kora-lp-container">
        <div className="kora-lp-final-card">
          <p className="kora-lp-final-eyebrow">{t("landing.heroEyebrow")}</p>
          <h2 id="final-cta-title">{t("landing.finalCtaTitle")}</h2>
          <p className="kora-lp-final-description">{t("landing.finalCtaDescription")}</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <KButton size="lg" arrow onClick={() => navigate("/categories")} className="min-h-12">
              {t("landing.discoverTalents")}
            </KButton>
            <Link
              to="/register?role=manager"
              className="inline-flex min-h-12 items-center rounded-full px-4 text-sm font-bold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t("landing.audienceManagerCta")}
            </Link>
          </div>
          <p className="mt-6 text-xs font-semibold text-white/75">{t("landing.ctaNote")}</p>
        </div>
      </div>
    </section>
  )
}
