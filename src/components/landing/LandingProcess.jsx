import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { MessageCircle, Rocket, Search } from "lucide-react"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { cn } from "@/lib/utils"
import { SectionHeader, useSurface } from "./landingKit.jsx"

function StepCard({ index, count, progress, number, Icon, title, text, label }) {
  const surface = useSurface()
  const reduce = useReducedMotion()
  const scale = useTransform(progress, [index / count, 1], [1, 1 - (count - 1 - index) * 0.045])
  return (
    <motion.article
      style={{ scale: reduce ? 1 : scale, top: `calc(5.5rem + ${index * 18}px)` }}
      className={cn("sticky mb-6 grid min-h-[11rem] grid-cols-[auto_1fr] items-center gap-4 overflow-hidden rounded-[1.4rem] p-5 sm:min-h-[12.5rem] sm:gap-6 sm:p-6", surface)}
    >
      <span aria-hidden="true" className="kora-lp-outline-num kora-lp-num select-none text-[3.2rem] font-extrabold leading-none sm:text-[4.8rem]">{number}</span>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold/15 text-gold-dark">
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        </div>
        <h3 className="kora-lp-card-title text-[1.25rem] sm:text-[1.65rem]">{title}</h3>
        <p className="kora-lp-body mt-2 max-w-xl text-sm sm:text-base">{text}</p>
      </div>
    </motion.article>
  )
}

/** Parcours en 3 étapes : les cartes s'empilent et se réduisent pendant le défilement. */
export default function LandingProcess() {
  const { t } = useI18n()
  const stackRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: stackRef, offset: ["start start", "end end"] })
  const icons = [Search, MessageCircle, Rocket]
  const steps = icons.map((Icon, i) => ({
    Icon,
    number: `0${i + 1}`,
    label: `${t("landing.processStepLabel")} ${i + 1}/${icons.length}`,
    title: t(`landing.processStep${i + 1}Title`),
    text: t(`landing.processStep${i + 1}Description`),
  }))

  return (
    <section id="how-it-works" className="kora-lp-section" aria-labelledby="process-title">
      <div className="kora-lp-container max-w-5xl">
        <SectionHeader
          titleId="process-title"
          eyebrow={t("landing.processEyebrow")}
          title={t("landing.processTitle")}
          description={t("landing.processDescription")}
        />
        <div ref={stackRef} className="pb-[2vh]">
          {steps.map((step, i) => (
            <StepCard key={step.number} index={i} count={steps.length} progress={scrollYProgress} {...step} />
          ))}
        </div>
      </div>
    </section>
  )
}
