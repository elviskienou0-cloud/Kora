import { useI18n } from "@/i18n/kora-i18n.jsx"
import { Reveal } from "./landingKit.jsx"

export default function LandingManifesto() {
  const { language } = useI18n()
  const en = language === "en"
  const items = en
    ? [
        ["OUR VISION", "Build a connected African talent ecosystem where skills can be discovered and opportunities can travel."],
        ["OUR AMBITION", "Make professional talent representation and collaboration more accessible across Africa and beyond."],
        ["OUR MISSION", "Give clients and managers a structured space to discover, connect, organize requests and develop collaborations."],
      ]
    : [
        ["NOTRE VISION", "Construire un écosystème africain connecté où les compétences se découvrent et où les opportunités circulent."],
        ["NOTRE AMBITION", "Rendre la représentation professionnelle des talents et les collaborations plus accessibles en Afrique et au-delà."],
        ["NOTRE MISSION", "Offrir aux clients et aux managers un espace structuré pour découvrir, échanger, organiser les demandes et développer des collaborations."],
      ]

  return (
    <section className="kora-lp-section kora-spotlight-manifesto kora-final-manifesto" aria-labelledby="manifesto-title">
      <div className="kora-lp-container">
        <Reveal>
          <p className="kora-final-manifesto-lead">{en ? "Talent is everywhere. Access and opportunity should be too." : "Les talents sont partout. L'accès aux opportunités doit l'être aussi."}</p>
        </Reveal>
        <div className="kora-final-manifesto-grid">
          {items.map(([title, text]) => <article key={title}><span>{title}</span><p>{text}</p></article>)}
        </div>
      </div>
    </section>
  )
}
