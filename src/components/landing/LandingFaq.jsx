import { useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Plus } from "lucide-react"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { cn } from "@/lib/utils"
import { EASE, Reveal, SectionHeader, useSurface } from "./landingKit.jsx"

function FaqItem({ id, question, answer, open, onToggle, index }) {
  const surface = useSurface()
  const reduce = useReducedMotion()
  return (
    <Reveal delay={index * 0.05}>
      <div className={cn("overflow-hidden rounded-3xl transition-colors duration-300", surface, open && "border-gold/50")}>
        <h3>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={`faq-panel-${id}`}
            id={`faq-button-${id}`}
            className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-8 sm:py-6"
          >
            <span className="text-[1.05rem] font-extrabold leading-snug tracking-tight text-[color:var(--lp-ink)] sm:text-xl">{question}</span>
            <motion.span
              aria-hidden="true"
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
              className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gold/15 text-gold-dark"
            >
              <Plus className="h-5 w-5" />
            </motion.span>
          </button>
        </h3>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="panel"
              id={`faq-panel-${id}`}
              role="region"
              aria-labelledby={`faq-button-${id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
            >
              <p className="kora-lp-body px-6 pb-6 text-base sm:px-8 sm:pb-8">{answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  )
}

export default function LandingFaq() {
  const { t } = useI18n()
  const [openIndex, setOpenIndex] = useState(0)
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({
    id: n,
    question: t(`landing.faqQ${n}`),
    answer: t(`landing.faqA${n}`),
  }))

  return (
    <section id="faq" className="kora-lp-section" aria-labelledby="faq-title">
      <div className="kora-lp-container max-w-4xl">
        <SectionHeader
          titleId="faq-title"
          eyebrow="FAQ"
          title={t("landing.faq")}
          description={t("landing.faqDescription")}
        />
        <div className="space-y-4">
          {items.map((item, i) => (
            <FaqItem
              key={item.id}
              index={i}
              id={item.id}
              question={item.question}
              answer={item.answer}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
        <Reveal className="mt-8 text-center">
          <Link to="/faq" className="text-sm font-extrabold text-foreground underline underline-offset-4 hover:text-gold-dark">
            {t("landing.faqSeeAll")}
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
