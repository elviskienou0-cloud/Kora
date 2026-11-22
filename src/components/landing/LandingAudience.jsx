import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Briefcase, CheckCircle2, Search } from "lucide-react"
import { KButton } from "@/components/ui/KButton"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { cn } from "@/lib/utils"
import { Reveal, SectionHeader, SpotlightCard, Tilt, scrollToSection, useSurface } from "./landingKit.jsx"

function Points({ items, dark }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <CheckCircle2 className={cn("mt-0.5 h-5 w-5 shrink-0", dark ? "text-amber-300" : "text-emerald-500")} />
          <span className={cn("text-[0.95rem] font-semibold leading-snug", dark ? "text-white/90" : "text-foreground/90")}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** Deux entrées explicites : le client qui cherche un talent, le manager qui en gère. */
export default function LandingAudience() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const surface = useSurface()
  const points = (prefix) => [1, 2, 3].map((n) => t(`landing.${prefix}${n}`))

  return (
    <section id="audience" className="kora-lp-section" aria-labelledby="audience-title">
      <div className="kora-lp-container">
        <SectionHeader
          titleId="audience-title"
          eyebrow={t("landing.audienceEyebrow")}
          title={t("landing.audienceTitle")}
          emphasis={t("landing.audienceTitleEmphasis")}
          description={t("landing.audienceDescription")}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal direction="left" className="h-full">
            <SpotlightCard className="rounded-[2rem]">
              <Tilt className="h-full">
                <article className={cn("relative flex h-full flex-col overflow-hidden rounded-[2rem] p-7 sm:p-10", surface)}>
                  <Search aria-hidden="true" className="absolute -bottom-10 -right-8 h-64 w-64 text-primary opacity-[0.05]" strokeWidth={1} />
                  <span className="mb-6 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-primary dark:bg-white/10 dark:text-foreground">
                    {t("landing.audienceClientTag")}
                  </span>
                  <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-gold-dark">
                    <Search className="h-7 w-7" strokeWidth={1.8} />
                  </span>
                  <h3 className="kora-lp-card-title text-[1.6rem] sm:text-[1.9rem]">{t("landing.audienceClientTitle")}</h3>
                  <p className="kora-lp-body mt-3 max-w-md">{t("landing.audienceClientText")}</p>
                  <Points items={points("audienceClientPoint")} />
                  <div className="relative mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                    <KButton variant="gold" size="lg" arrow onClick={() => navigate("/categories")}>{t("landing.audienceClientCta")}</KButton>
                    <Link to="/register?role=client" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-foreground underline-offset-4 hover:underline">
                      {t("landing.audienceClientSecondary")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              </Tilt>
            </SpotlightCard>
          </Reveal>

          <Reveal direction="right" className="h-full" delay={0.1}>
            <SpotlightCard className="rounded-[2rem]">
              <Tilt className="h-full">
                <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-[0_28px_60px_-28px_rgba(20,30,60,0.65)] sm:p-10">
                  <Briefcase aria-hidden="true" className="absolute -bottom-10 -right-8 h-64 w-64 text-white opacity-[0.06]" strokeWidth={1} />
                  <span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gold/25 blur-3xl" />
                  <span className="mb-6 inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-amber-200">
                    {t("landing.audienceManagerTag")}
                  </span>
                  <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-amber-300">
                    <Briefcase className="h-7 w-7" strokeWidth={1.8} />
                  </span>
                  <h3 className="text-[1.6rem] font-extrabold leading-[1.15] tracking-[-0.022em] text-white sm:text-[1.9rem]">{t("landing.audienceManagerTitle")}</h3>
                  <p className="mt-3 max-w-md text-[0.95rem] font-medium leading-[1.7] text-white/75">{t("landing.audienceManagerText")}</p>
                  <Points items={points("audienceManagerPoint")} dark />
                  <div className="relative mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                    <KButton variant="gold" size="lg" arrow onClick={() => navigate("/register?role=manager")}>{t("landing.audienceManagerCta")}</KButton>
                    <button
                      type="button"
                      onClick={() => scrollToSection("pricing")}
                      className="inline-flex items-center gap-1.5 text-sm font-extrabold text-white underline-offset-4 hover:underline"
                    >
                      {t("landing.audienceManagerSecondary")} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              </Tilt>
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
