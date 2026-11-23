import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { GlassBar, KButton } from "@/components/ui/KButton"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { cn } from "@/lib/utils"
import { Reveal, useLite } from "./landingKit.jsx"

const BLOBS = ["-left-16 -top-16 h-64 w-64", "right-10 top-1/2 h-40 w-40", "-bottom-20 left-1/3 h-72 w-72"]

/** Appel final : un panneau doré qui grandit, avec les deux entrées (client et manager). */
export default function LandingFinalCta() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const lite = useLite()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] })
  const still = reduce || lite
  const scale = useTransform(scrollYProgress, [0, 1], [still ? 1 : 0.9, 1])
  const radius = useTransform(scrollYProgress, [0, 1], [still ? 40 : 110, 40])

  return (
    <section ref={ref} className="px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20" aria-labelledby="final-cta-title">
      <motion.div
        style={{ scale, borderRadius: radius }}
        className="gold-gradient relative mx-auto max-w-6xl overflow-hidden px-4 py-14 text-center text-primary-foreground sm:px-10 sm:py-20"
      >
        {!still && BLOBS.map((pos, i) => (
          <motion.span
            key={pos}
            aria-hidden="true"
            animate={{ y: [0, -22, 0], x: [0, i % 2 ? -14 : 14, 0] }}
            transition={{ duration: 7 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            className={cn("pointer-events-none absolute rounded-full bg-white/30 blur-2xl", pos)}
          />
        ))}
        <GlassBar className="relative mx-auto max-w-4xl rounded-[2.25rem] border-white/30 bg-white/15 px-6 py-12 sm:px-12 sm:py-16">
          <Reveal direction="scale">
            <h2 id="final-cta-title" className="mx-auto mb-5 max-w-3xl text-[2rem] font-extrabold leading-[1.06] tracking-[-0.035em] sm:text-5xl lg:text-[3.4rem]">
              {t("landing.finalCtaTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mb-9 max-w-2xl text-base font-medium leading-relaxed opacity-90 sm:text-lg">{t("landing.finalCtaDescription")}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <KButton variant="glass" size="lg" arrow magnetic className="bg-background text-foreground hover:bg-background/90" onClick={() => navigate("/categories")}>
                {t("landing.audienceClientCta")}
              </KButton>
              <KButton variant="glass" size="lg" magnetic className="border-white/45 bg-transparent text-primary-foreground hover:bg-white/20" onClick={() => navigate("/register?role=manager")}>
                {t("landing.audienceManagerCta")}
              </KButton>
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] opacity-80">{t("landing.ctaNote")}</p>
          </Reveal>
        </GlassBar>
      </motion.div>
    </section>
  )
}
