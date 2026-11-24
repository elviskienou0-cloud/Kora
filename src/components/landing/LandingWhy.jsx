import { BriefcaseBusiness, Search, ShieldCheck, Workflow } from "lucide-react"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { Reveal, SectionHeader } from "./landingKit.jsx"

export default function LandingWhy() {
  const { t } = useI18n()
  const features = [
    [ShieldCheck, t("landing.featureProfilesTitle"), t("landing.featureProfilesDescription")],
    [Search, t("landing.featureSearchTitle"), t("landing.featureSearchDescription")],
    [Workflow, t("landing.featureCollaborationTitle"), t("landing.featureCollaborationDescription")],
    [BriefcaseBusiness, t("landing.whyWorkspaceTitle"), t("landing.whyWorkspaceText")],
  ]
  return <section id="why-kora" className="kora-lp-section kora-spotlight-why" aria-labelledby="why-title">
    <div className="kora-lp-container">
      <SectionHeader titleId="why-title" eyebrow={t("landing.featureBadge")} title={t("landing.featureTitle")} emphasis={t("landing.featureTitleEmphasis")} description={t("landing.featureDescription")} />
      <div className="kora-spotlight-bento">
        {features.map(([Icon, title, description], index) => <Reveal key={title} delay={index * .05} className={"kora-spotlight-bento-item kora-spotlight-bento-item-" + index}>
          <article className="kora-lp-feature-card"><span className="kora-lp-feature-icon"><Icon className="h-6 w-6" aria-hidden="true" /></span><h3 className="kora-lp-card-title">{title}</h3><p className="kora-lp-body">{description}</p></article>
        </Reveal>)}
      </div>
    </div>
  </section>
}
