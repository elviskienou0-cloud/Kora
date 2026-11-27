import { useEffect, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Globe2, MapPin, Search, UserRound, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"
import { resolveTalentProfileMediaBatch } from "@/lib/talentMedia"
import { Reveal, SectionHeader } from "./landingKit.jsx"

function talentName(talent) {
  return [talent.first_name, talent.last_name].filter(Boolean).join(" ") || talent.title || "Talent"
}

export default function LandingProcess() {
  const { t, language } = useI18n()
  const en = language === "en"
  const [talents, setTalents] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadPublishedTalents = async () => {
      try {
        const { data, error } = await supabase
          .from("talent_profiles")
          .select("id, first_name, last_name, title, city, avatar_url, rating, categories(name), countries(name)")
          .eq("status", "published")
          .eq("is_visible", true)
          .order("updated_at", { ascending: false })
          .limit(8)
        if (error) throw error
        const resolved = await resolveTalentProfileMediaBatch(data || [])
        if (mounted) setTalents(resolved)
      } catch (error) {
        console.warn("KORA: profils publics indisponibles pour la présentation.", error)
        if (mounted) setTalents([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadPublishedTalents()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (talents.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % talents.length), 6500)
    return () => window.clearInterval(timer)
  }, [talents.length])

  const current = talents[activeIndex] || null
  const stepLabels = en
    ? [
        ["Client", "Defines a need and explores published profiles."],
        ["KORA platform", "Centralizes discovery, requests and communication."],
        ["Manager", "Receives the request and represents the talent."],
        ["Talent", "The professional selected for the collaboration."],
      ]
    : [
        ["Client", "Exprime un besoin et découvre les profils publiés."],
        ["Plateforme KORA", "Centralise la découverte, les demandes et les échanges."],
        ["Manager", "Reçoit la demande et représente le talent."],
        ["Talent", "Le professionnel choisi pour la collaboration."],
      ]
  const icons = [Search, Globe2, BriefcaseBusiness, UserRound]

  return (
    <section id="how-it-works" className="kora-lp-section kora-spotlight-process-section kora-final-process" aria-labelledby="process-title">
      <div className="kora-lp-container">
        <SectionHeader
          titleId="process-title"
          eyebrow={en ? "A CLEAR JOURNEY" : "UN PARCOURS CLAIR"}
          title={en ? "How does KORA work?" : "Comment fonctionne KORA ?"}
          description={en ? "A structured path that connects a client to a talent through the manager." : "Un parcours structuré qui relie un client à un talent par l'intermédiaire de son manager."}
        />
        <div className="kora-final-process-grid">
          <div className="kora-final-flow">
            {stepLabels.map(([title, description], index) => {
              const Icon = icons[index]
              return (
                <Reveal key={title} delay={index * 0.05}>
                  <article className="kora-final-flow-step">
                    <span className="kora-final-flow-icon"><Icon size={21} strokeWidth={1.7}/></span>
                    <div><small>0{index + 1}</small><h3>{title}</h3><p>{description}</p></div>
                    {index < stepLabels.length - 1 && <ArrowDown className="kora-final-flow-arrow" size={18} aria-hidden="true"/>}
                  </article>
                </Reveal>
              )
            })}
          </div>

          <div className="kora-final-talent-panel">
            <div className="kora-final-talent-heading">
              <div><small>{en ? "REAL KORA PROFILES" : "PROFILS RÉELS KORA"}</small><h3>{en ? "Talents on the platform" : "Des talents inscrits sur KORA"}</h3></div>
              <div className="kora-final-talent-controls">
                <button type="button" onClick={() => setActiveIndex((i) => talents.length ? (i - 1 + talents.length) % talents.length : 0)} disabled={talents.length < 2} aria-label={en ? "Previous profile" : "Profil précédent"}><ArrowLeft size={17}/></button>
                <button type="button" onClick={() => setActiveIndex((i) => talents.length ? (i + 1) % talents.length : 0)} disabled={talents.length < 2} aria-label={en ? "Next profile" : "Profil suivant"}><ArrowRight size={17}/></button>
              </div>
            </div>
            {loading ? (
              <div className="kora-final-talent-empty">{en ? "Loading published profiles…" : "Chargement des profils publiés…"}</div>
            ) : current ? (
              <Link to={"/talent/" + current.id} className="kora-final-talent-card">
                <div className="kora-final-talent-photo">
                  {current.avatar_url ? <img src={current.avatar_url} alt={talentName(current)} loading="lazy" decoding="async"/> : <UserRound size={54} aria-hidden="true"/>}
                  {current.categories?.name && <span>{current.categories.name}</span>}
                </div>
                <div className="kora-final-talent-details">
                  <div><h4>{talentName(current)}</h4><p>{current.title || (en ? "Published talent profile" : "Profil talent publié")}</p></div>
                  <div className="kora-final-talent-meta">
                    <span><MapPin size={14}/>{current.countries?.name || current.city || (en ? "Location not provided" : "Localisation non renseignée")}</span>
                    <span><CheckCircle2 size={14}/>{en ? "Published profile" : "Profil publié"}</span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="kora-final-talent-empty">
                <Users size={34} aria-hidden="true"/>
                <p>{en ? "Published talent profiles will appear here when available." : "Les profils de talents publiés apparaîtront ici dès qu'ils seront disponibles."}</p>
              </div>
            )}
            <p className="kora-final-talent-note">{en ? "Profiles are loaded from KORA's public directory. Use the arrows to browse." : "Les profils proviennent de l'annuaire public KORA. Utilisez les flèches pour les parcourir."}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
