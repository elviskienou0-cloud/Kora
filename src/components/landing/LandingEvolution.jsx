import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, ArrowRight, MapPin, Star, UserRound, Users, BriefcaseBusiness, Globe2, Heart } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"


function getName(talent) {
  return `${talent.first_name || ""} ${talent.last_name || ""}`.trim() || talent.title || "Talent"
}

async function getTalentAvatarUrl(value) {
  if (!value) return null
  if (value.startsWith("http://") || value.startsWith("https://")) return value

  const prefix = "storage://"
  if (!value.startsWith(prefix)) return null
  const remainder = value.slice(prefix.length)
  const separator = remainder.indexOf("/")
  if (separator < 1 || separator === remainder.length - 1) return null

  const bucket = remainder.slice(0, separator)
  const path = remainder.slice(separator + 1)
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
  if (error) {
    console.warn("KORA: impossible de charger une photo de profil talent.")
    return null
  }
  return data?.signedUrl || null
}

function TalentPortrait({ talent, className = "", decorative = false }) {
  const [hasError, setHasError] = useState(false)
  if (!talent.avatar_url || hasError) {
    return <div className={"kora-talent-card-placeholder " + className} aria-hidden="true"><UserRound size={48} /></div>
  }
  return <img className={className} src={talent.avatar_url} alt={decorative ? "" : getName(talent)} draggable="false" loading="lazy" onError={() => setHasError(true)} />
}
export default function LandingEvolution({ stats = [], language = "fr" }) {
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
        const talentsWithPhotos = await Promise.all(
          (data || []).map(async (talent) => ({
            ...talent,
            avatar_url: await getTalentAvatarUrl(talent.avatar_url),
          }))
        )

        if (mounted) setTalents(talentsWithPhotos)
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
    <section id="evolutions" className="kora-evolution-section py-14 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduceMotion ? 0 : 0.55 }}
          className="flex justify-center mb-8"
        >
          <h2 className="kora-evolution-title">{language === "en" ? "Evolution" : "Évolutions"}</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.95fr] gap-6 lg:gap-9 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-2 gap-3 sm:gap-4"
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
                <p>{language === "en" ? "THE KORA COMMUNITY" : "LA COMMUNAUTÉ KORA"}</p>
                <h3>{language === "en" ? "Talents to discover" : "Des talents à découvrir"}</h3>
              </div>
              <div className="kora-talent-controls">
                <button type="button" onClick={previousTalent} disabled={talents.length < 2} aria-label={language === "en" ? "Previous talent" : "Talent précédent"}><ArrowLeft size={18}/></button>
                <button type="button" onClick={nextTalentCard} disabled={talents.length < 2} aria-label={language === "en" ? "Next talent" : "Talent suivant"}><ArrowRight size={18}/></button>
              </div>
            </div>

            {currentTalent ? (
              <div className="kora-talent-stack" aria-label={language === "en" ? "Swipe the card to discover more talents" : "Faites glisser la carte pour découvrir d'autres talents"}>
                {nextTalent && (
                  <div className="kora-talent-stack-card kora-talent-stack-card-back" aria-hidden="true">
                    <TalentPortrait talent={nextTalent} decorative />
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
                    dragElastic={0.32}
                    dragMomentum={false}
                    dragSnapToOrigin
                    dragTransition={{ bounceStiffness: 520, bounceDamping: 34 }}
                    onDragEnd={(_, info) => {
                      const swipeDistance = 55
                      const swipeVelocity = 450
                      if (info.offset.x < -swipeDistance || info.velocity.x < -swipeVelocity) {
                        nextTalentCard()
                      } else if (info.offset.x > swipeDistance || info.velocity.x > swipeVelocity) {
                        previousTalent()
                      }
                    }}
                    whileDrag={{ scale: 1.015, cursor: "grabbing" }}
                  >
                    <Link to={`/talent/${currentTalent.id}`} className="kora-talent-card-link" aria-label={`${language === "en" ? "View profile of" : "Voir le profil de"} ${getName(currentTalent)}`}>
                      <div className="kora-talent-card-photo">
                        <TalentPortrait talent={currentTalent} className="kora-talent-photo-image" />
                        <span>{currentTalent.categories?.name || (language === "en" ? "Featured talent" : "Talent à découvrir")}</span>
                      </div>
                      <div className="kora-talent-card-content">
                        <div>
                          <h4>{getName(currentTalent)}</h4>
                          <p>{currentTalent.title || (language === "en" ? "Talent profile" : "Profil talent")}</p>
                        </div>
                        <div className="kora-talent-card-meta">
                          <span><MapPin size={14}/>{currentTalent.countries?.name || currentTalent.city || (language === "en" ? "Location not provided" : "Localisation non renseignée")}</span>
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
                  <p>{language === "en" ? "Published profiles will appear here as soon as they are available." : "Les profils publiés apparaîtront ici dès qu'ils seront disponibles."}</p>
                </CardContent>
              </Card>
            )}
            <p className="kora-talent-hint">{language === "en" ? "Swipe the card or use the arrows to discover profiles." : "Faites glisser la carte ou utilisez les flèches pour découvrir les profils."}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
