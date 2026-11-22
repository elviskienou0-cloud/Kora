import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { Award, Rocket, Shield, Target, TrendingUp, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { cn } from "@/lib/utils"
import { Reveal, SectionHeader, SpotlightCard, useLite, useSurface } from "./landingKit.jsx"

/* Texte qui s'allume mot par mot pendant le défilement */
function ScrollWord({ word, index, total, progress }) {
  const start = (index / total) * 0.8
  const opacity = useTransform(progress, [start, start + 0.12], [0.14, 1])
  return <motion.span style={{ opacity }} className="mr-[0.28em] inline-block">{word}</motion.span>
}

function Manifesto({ text }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.55"] })
  const cls = "mx-auto max-w-4xl text-center text-[1.6rem] font-extrabold leading-[1.2] tracking-[-0.03em] text-[color:var(--lp-ink)] sm:text-4xl lg:text-5xl"
  if (reduce) return <p className={cls}>{text}</p>
  const words = text.split(" ")
  return (
    <p ref={ref} className={cls}>
      {words.map((w, i) => <ScrollWord key={`${w}-${i}`} word={w} index={i} total={words.length} progress={scrollYProgress} />)}
    </p>
  )
}

const SPANS = ["lg:col-span-2 lg:row-span-2", "", "", "", "", "sm:col-span-2 lg:col-span-4"]

export default function LandingWhy() {
  const { t } = useI18n()
  const surface = useSurface()
  const lite = useLite()
  const reduce = useReducedMotion()

  const features = [
    [Shield, t("landing.featureProfilesTitle"), t("landing.featureProfilesDescription")],
    [Zap, t("landing.featureSearchTitle"), t("landing.featureSearchDescription")],
    [TrendingUp, t("landing.featureSubscriptionTitle"), t("landing.featureSubscriptionDescription")],
    [Target, t("landing.featureCollaborationTitle"), t("landing.featureCollaborationDescription")],
    [Award, t("landing.featurePublishedTitle"), t("landing.featurePublishedDescription")],
    [Rocket, t("landing.whyWorkspaceTitle"), t("landing.whyWorkspaceText")],
  ]

  return (
    <section id="why-kora" className="kora-lp-section" aria-labelledby="why-title">
      <div className="kora-lp-container">
        <SectionHeader
          titleId="why-title"
          eyebrow={t("landing.featureBadge")}
          title={t("landing.featureTitle")}
          emphasis={t("landing.featureTitleEmphasis")}
        />
        <div className="mb-14 lg:mb-20"><Manifesto text={t("landing.whyManifesto")} /></div>

        <div className="grid auto-rows-[minmax(13rem,auto)] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([Icon, title, description], i) => {
            const big = i === 0
            return (
              <Reveal key={title} direction={i % 2 === 0 ? "left" : "right"} delay={(i % 3) * 0.08} className={SPANS[i]}>
                <SpotlightCard className="rounded-[1.75rem]">
                  <Card className={cn("relative h-full overflow-hidden rounded-[1.75rem] transition-transform duration-300 hover:-translate-y-1", surface)}>
                    {big && <Icon aria-hidden="true" className="absolute -bottom-10 -right-10 h-72 w-72 text-primary opacity-[0.06]" strokeWidth={1} />}
                    <CardContent className={cn("relative flex h-full flex-col justify-end", big ? "p-8 lg:p-11" : "p-7")}>
                      <motion.span
                        animate={reduce || lite ? undefined : { y: [0, -7, 0] }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                        className={cn("mb-auto grid w-fit place-items-center bg-gold/15 text-gold-dark", big ? "h-20 w-20 rounded-3xl" : "h-14 w-14 rounded-2xl")}
                      >
                        <Icon className={big ? "h-10 w-10" : "h-7 w-7"} strokeWidth={1.8} />
                      </motion.span>
                      <h3 className={cn("kora-lp-card-title mb-3 mt-8", big && "text-[1.9rem] lg:text-[2.3rem]")}>{title}</h3>
                      <p className={cn("kora-lp-body", big && "max-w-md text-base")}>{description}</p>
                    </CardContent>
                  </Card>
                </SpotlightCard>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
