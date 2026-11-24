import { useI18n } from "@/i18n/kora-i18n.jsx"
import { Reveal } from "./landingKit.jsx"

export default function LandingManifesto() {
  const { t } = useI18n()
  return <section className="kora-lp-section kora-spotlight-manifesto" aria-label={t("landing.heroEyebrow")}>
    <div className="kora-lp-container"><Reveal><p>{t("landing.whyManifesto")}</p></Reveal></div>
  </section>
}
