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

  return (
    <section id="how-it-works" className="kora-lp-section" aria-labelledby="process-title">
      <div className="kora-lp-container">
        <SectionHeader
          titleId="process-title"
          eyebrow={t("landing.processEyebrow")}
          title={t("landing.processTitle")}
          description={t("landing.processDescription")}
        />

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 0.06}>
              <article className="kora-lp-step-card h-full">
                <span className="kora-lp-step-number" aria-hidden="true">0{index + 1}</span>
                <span className="kora-lp-step-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="kora-lp-card-title mt-5">{title}</h3>
                <p className="kora-lp-body mt-3">{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
