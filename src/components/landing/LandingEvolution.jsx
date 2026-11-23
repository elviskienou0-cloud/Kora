import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, ArrowRight, MapPin, Star, UserRound, Users, Globe2, Heart } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { resolveTalentProfileMediaBatch } from "@/lib/talentMedia"
import { useI18n } from "@/i18n/kora-i18n.jsx"

function getName(talent) {
  return ((talent.first_name || "") + " " + (talent.last_name || "")).trim() || talent.title || "Talent"
}

function TalentPortrait({ talent, className = "", decorative = false }) {
  const [hasError, setHasError] = useState(false)

  if (!talent.avatar_url || hasError) {
    return <div className={"kora-talent-card-placeholder " + className} aria-hidden="true"><UserRound size={48} /></div>
  }

  return (
    <img
      className={className}
      src={talent.avatar_url}
      alt={decorative ? "" : getName(talent)}
      width="640"
      height="480"
      loading="lazy"
      decoding="async"
      draggable="false"
      onError={() => setHasError(true)}
    />
  )
}

export default function LandingEvolution({ stats = [], loading = false }) {
  const { t, language } = useI18n()
  const [talents, setTalents] = useState([])
  const [talentsLoading, setTalentsLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let mounted = true

    const loadTalents = async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("id, first_name, last_name, title, city, avatar_url, rating, reviews_count, categories(name), countries(name)")
        .eq("status", "published")
        .eq("is_visible", true)
        .order("rating", { ascending: false })
        .limit(8)

      if (!mounted) return
      if (error) {
        console.warn("KORA: impossible de charger les profils publics pour la vitrine.")
        setTalents([])
        setTalentsLoading(false)
        return
      }

      try {
        const talentsWithPhotos = await resolveTalentProfileMediaBatch(data || [])
        if (mounted) setTalents(talentsWithPhotos)
      } catch (mediaError) {
        console.warn("KORA: impossible de charger les photos de la vitrine.", mediaError)
        if (mounted) setTalents(data || [])
      } finally {
        if (mounted) setTalentsLoading(false)
      }
    }

    loadTalents()
    return () => { mounted = false }
  }, [])

  const visibleStats = useMemo(() => stats.filter((stat) => loading || stat.value !== "—").slice(0, 3), [stats, loading])
  const statIcons = [Users, Globe2, Star]
  const currentTalent = talents.length ? talents[activeIndex % talents.length] : null
  const nextTalent = talents.length > 1 ? talents[(activeIndex + 1) % talents.length] : null

  const previousTalent = () => {
    setActiveIndex((index) => talents.length ? (index - 1 + talents.length) % talents.length : 0)
  }
  const nextTalentCard = () => {
    setActiveIndex((index) => talents.length ? (index + 1) % talents.length : 0)
  }

  return (
    <section id="community" className="kora-evolution-section kora-lp-section" aria-labelledby="community-title">
      <div className="kora-lp-container">
        <div className="mb-7 text-center">
          <p className="kora-lp-eyebrow-pill">{t("landing.evolutionTitle")}</p>
          <h2 id="community-title" className="kora-lp-title mt-4">{t("landing.featuredTalents")}</h2>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-9">
          <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-busy={loading}>
            {visibleStats.map((stat, index) => {
              const Icon = stat.icon || statIcons[index] || Heart
              return (
                <article key={stat.label} className="kora-evolution-stat">
                  <span className="kora-evolution-stat-icon"><Icon size={21} strokeWidth={1.8} aria-hidden="true" /></span>
                  <strong>{loading ? "—" : stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              )
            })}
          </div>

          <div className="kora-talent-showcase">
            <div className="kora-talent-showcase-heading">
              <div>
                <p>{t("landing.heroEyebrow")}</p>
                <h3>{t("landing.featuredTalents")}</h3>
              </div>
              <div className="kora-talent-controls">
                <button type="button" onClick={previousTalent} disabled={talents.length < 2} aria-label={language === "en" ? "Previous talent" : "Talent précédent"}>
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <button type="button" onClick={nextTalentCard} disabled={talents.length < 2} aria-label={language === "en" ? "Next talent" : "Talent suivant"}>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {talentsLoading ? (
              <Card className="kora-talent-empty">
                <CardContent className="p-7 text-center">
                  <p>{t("common.loading")}</p>
                </CardContent>
              </Card>
            ) : currentTalent ? (
              <div className="kora-talent-stack" aria-label={language === "en" ? "Featured talent profiles" : "Profils de talents mis en avant"}>
                {nextTalent && (
                  <div className="kora-talent-stack-card kora-talent-stack-card-back" aria-hidden="true">
                    <TalentPortrait talent={nextTalent} decorative />
                    <span>{getName(nextTalent)}</span>
                  </div>
                )}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentTalent.id}
                    className="kora-talent-stack-card kora-talent-stack-card-front"
                    initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
                    drag={talents.length > 1 && !reduceMotion ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.24}
                    dragMomentum={false}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -55 || info.velocity.x < -450) nextTalentCard()
                      else if (info.offset.x > 55 || info.velocity.x > 450) previousTalent()
                    }}
                  >
                    <Link to={"/talent/" + currentTalent.id} className="kora-talent-card-link" aria-label={(language === "en" ? "View profile of " : "Voir le profil de ") + getName(currentTalent)}>
                      <div className="kora-talent-card-photo">
                        <TalentPortrait talent={currentTalent} className="kora-talent-photo-image" />
                        <span>{currentTalent.categories?.name || (language === "en" ? "Talent" : "Talent")}</span>
                      </div>
                      <div className="kora-talent-card-content">
                        <div>
                          <h4>{getName(currentTalent)}</h4>
                          <p>{currentTalent.title || (language === "en" ? "Talent profile" : "Profil talent")}</p>
                        </div>
                        <div className="kora-talent-card-meta">
                          <span><MapPin size={14} aria-hidden="true" />{currentTalent.countries?.name || currentTalent.city || (language === "en" ? "Location not provided" : "Localisation non renseignée")}</span>
                          <span><Star size={14} aria-hidden="true" />{Number(currentTalent.rating || 0) > 0 ? Number(currentTalent.rating).toFixed(1) : "—"}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <Card className="kora-talent-empty">
                <CardContent className="p-7 text-center">
                  <UserRound className="mx-auto mb-3 text-muted-foreground" size={30} aria-hidden="true" />
                  <p>{language === "en" ? "Published profiles will appear here when available." : "Les profils publiés apparaîtront ici dès qu’ils seront disponibles."}</p>
                </CardContent>
              </Card>
            )}
            <p className="kora-talent-hint">{language === "en" ? "Use the arrows or swipe to browse published profiles." : "Utilisez les flèches ou faites glisser la carte pour parcourir les profils publiés."}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
