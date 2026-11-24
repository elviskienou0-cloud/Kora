import { MessageCircle, Rocket, Search } from "lucide-react"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { Reveal, SectionHeader } from "./landingKit.jsx"

export default function LandingProcess() {
  const { t } = useI18n()
  const steps = [
    { Icon: Search, title: t("landing.processStep1Title"), text: t("landing.processStep1Description") },
    { Icon: MessageCircle, title: t("landing.processStep2Title"), text: t("landing.processStep2Description") },
    { Icon: Rocket, title: t("landing.processStep3Title"), text: t("landing.processStep3Description") },
  ]
  return <section id="how-it-works" className="kora-lp-section kora-spotlight-process-section" aria-labelledby="process-title">
    <div className="kora-lp-container">
      <SectionHeader titleId="process-title" eyebrow={t("landing.processEyebrow")} title={t("landing.processTitle")} description={t("landing.processDescription")} />
      <div className="kora-spotlight-process">
        {steps.map(({ Icon, title, text }, index) => <Reveal key={title} delay={index * .06} className="kora-spotlight-process-item" style={{ "--step-index": index }}>
          <article className="kora-lp-step-card">
            <span className="kora-lp-step-number" aria-hidden="true">0{index + 1}</span>
            <span className="kora-lp-step-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <div><p className="kora-spotlight-step-label">{t("landing.processStepLabel")} 0{index + 1}</p><h3 className="kora-lp-card-title">{title}</h3><p className="kora-lp-body">{text}</p></div>
          </article>
        </Reveal>)}
      </div>
    </div>
  </section>
}
