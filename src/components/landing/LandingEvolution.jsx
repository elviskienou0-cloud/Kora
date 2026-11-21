import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, ArrowRight, MapPin, Star, UserRound, Users, BriefcaseBusiness, Globe2, Heart } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

const icons = {
  "Talents inscrits": Users,
  Projets: BriefcaseBusiness,
  "Pays représentés": Globe2,
  "Satisfaction moyenne": Star,
}

function getName(talent) {
  return `${talent.first_name || ""} ${talent.last_name || ""}`.trim() || talent.title || "Talent"
}

export default function LandingEvolution({ stats = [], t }) {
  const [talents, setTalents] = useState([])
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
      } else {
        setTalents(data || [])
      }
    }

    loadTalents()
    return () => { mounted = false }
  }, [])

  const visibleStats = useMemo(() => stats.slice(0, 4), [stats])
  const statIcons = [Users, BriefcaseBusiness, Globe2, Star]
  const currentTalent = talents.length ? talents[activeIndex % talents.length] : null
  const nextTalent = talents.length > 1 ? talents[(activeIndex + 1) % talents.length] : null
  const previousTalent = () => setActiveIndex((index) => talents.length ? (index - 1 + talents.length) % talents.length : 0)
  const nextTalentCard = () => setActiveIndex((index) => talents.length ? (index + 1) % talents.length : 0)

  return (
    <section id="evolutions" className="kora-evolution-section py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduceMotion ? 0 : 0.55 }}
          className="flex justify-center mb-12"
        >
          <h2 className="kora-evolution-title">{t("landing.evolutionTitle", "Évolutions")}</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-10 lg:gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-2 gap-4 sm:gap-5"
          >
            {visibleStats.map((stat, index) => {
              const Icon = statIcons[index] || Heart
              return (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 24, scale: 0.96 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: reduceMotion ? 0 : 0.5 } },
                  }}
                  whileHover={reduceMotion ? undefined : { y: -5, scale: 1.015 }}
                  className="kora-evolution-stat"
                >
                  <span className="kora-evolution-stat-icon"><Icon size={22} strokeWidth={1.8} /></span>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </motion.div>
              )
            })}
          </motion.div>

          <div className="kora-talent-showcase">
            <div className="kora-talent-showcase-heading">
              <div>
                <p>{t("landing.talentShowcaseEyebrow", "La communauté KORA")}</p>
                <h3>{t("landing.talentShowcaseTitle", "Des talents à découvrir")}</h3>
              </div>
              <div className="kora-talent-controls">
                <button type="button" onClick={previousTalent} disabled={talents.length < 2} aria-label={t("landing.previousTalent", "Talent précédent")}><ArrowLeft size={18}/></button>
                <button type="button" onClick={nextTalentCard} disabled={talents.length < 2} aria-label={t("landing.nextTalent", "Talent suivant")}><ArrowRight size={18}/></button>
              </div>
            </div>

            {currentTalent ? (
              <div className="kora-talent-stack" aria-label={t("landing.talentStackInstructions", "Faites glisser la carte pour découvrir d'autres talents")}>
                {nextTalent && (
                  <div className="kora-talent-stack-card kora-talent-stack-card-back" aria-hidden="true">
                    {nextTalent.avatar_url && <img src={nextTalent.avatar_url} alt="" draggable="false" />}
                    <span>{getName(nextTalent)}</span>
                  </div>
                )}
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentTalent.id}
                    className="kora-talent-stack-card kora-talent-stack-card-front"
                    initial={{ opacity: 0, x: 55, rotate: 5, scale: 0.94 }}
                    animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -65, rotate: -7, scale: 0.92 }}
                    transition={{ duration: reduceMotion ? 0 : 0.32, ease: "easeOut" }}
                    drag={talents.length > 1 && !reduceMotion ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.72}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -65) nextTalentCard()
                      if (info.offset.x > 65) previousTalent()
                    }}
                    whileDrag={{ rotate: 4, scale: 1.02, cursor: "grabbing" }}
                  >
                    <Link to={`/talent/${currentTalent.id}`} className="kora-talent-card-link" aria-label={`${t("landing.viewTalent", "Voir le profil de")} ${getName(currentTalent)}`}>
                      <div className="kora-talent-card-photo">
                        {currentTalent.avatar_url
                          ? <img src={currentTalent.avatar_url} alt={getName(currentTalent)} draggable="false" />
                          : <div className="kora-talent-card-placeholder"><UserRound size={48}/></div>}
                        <span>{currentTalent.categories?.name || t("landing.featuredTalent", "Talent à découvrir")}</span>
                      </div>
                      <div className="kora-talent-card-content">
                        <div>
                          <h4>{getName(currentTalent)}</h4>
                          <p>{currentTalent.title || t("landing.talentProfile", "Profil talent")}</p>
                        </div>
                        <div className="kora-talent-card-meta">
                          <span><MapPin size={14}/>{currentTalent.countries?.name || currentTalent.city || t("landing.locationNotProvided", "Localisation non renseignée")}</span>
                          <span><Star size={14}/>{Number(currentTalent.rating || 0) > 0 ? Number(currentTalent.rating).toFixed(1) : "—"}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <Card className="kora-talent-empty">
                <CardContent className="p-8 text-center">
                  <UserRound className="mx-auto mb-3 text-muted-foreground" size={32}/>
                  <p>{t("landing.noFeaturedTalents", "Les profils publiés apparaîtront ici dès qu'ils seront disponibles.")}</p>
                </CardContent>
              </Card>
            )}
            <p className="kora-talent-hint">{t("landing.talentStackHint", "Faites glisser la carte ou utilisez les flèches pour découvrir les profils.")}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
