import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { Reveal, SectionHeader } from "./landingKit.jsx"

function FaqItem({ id, question, answer, open, onToggle }) {
  return (
    <article className={"kora-lp-faq-item " + (open ? "is-open" : "")}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={"faq-panel-" + id}
          id={"faq-button-" + id}
          className="flex min-h-14 w-full items-center justify-between gap-5 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6"
        >
          <span className="text-base font-bold leading-snug text-foreground">{question}</span>
          <span className={"grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/10 text-gold-dark transition-transform " + (open ? "rotate-45" : "")} aria-hidden="true">
            <Plus className="h-5 w-5" />
          </span>
        </button>
      </h3>
      <div hidden={!open} id={"faq-panel-" + id} role="region" aria-labelledby={"faq-button-" + id} className="px-5 pb-5 sm:px-6 sm:pb-6">
        <p className="kora-lp-body">{answer}</p>
      </div>
    </article>
  )
}

export default function LandingFaq() {
  const { t } = useI18n()
  const [openIndex, setOpenIndex] = useState(0)
  const items = [1, 2, 3, 4, 5, 6].map((number) => ({
    id: number,
    question: t("landing.faqQ" + number),
    answer: t("landing.faqA" + number),
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
        <div className="space-y-3">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.03}>
              <FaqItem
                {...item}
                open={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            </Reveal>
          ))}
        </div>
        <div className="mt-7 text-center">
          <Link to="/faq" className="inline-flex min-h-12 items-center rounded-full px-4 text-sm font-bold text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t("landing.faqSeeAll")}
          </Link>
        </div>
      </div>
    </section>
  )
}
