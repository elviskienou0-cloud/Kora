import { useNavigate } from "react-router-dom"
import { ArrowDown, ArrowRight, Bell, FolderKanban, MessageCircle, Search, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"

function PhoneFrame({ type }) {
  const isClient = type === "client"
  return (
    <div className={isClient ? "kora-phone kora-phone-client" : "kora-phone kora-phone-manager"} aria-label={isClient ? "Aperçu de l'espace Client" : "Aperçu de l'espace Manager"}>
      <div className="kora-phone-notch" />
      <div className="kora-phone-screen">
        <div className="kora-phone-topbar">
          <span className="kora-phone-brand"><span>K</span>ORA</span>
          <Bell className="h-4 w-4" aria-hidden="true" />
        </div>
        {isClient ? (
          <>
            <p className="kora-phone-eyebrow">ESPACE CLIENT</p>
            <h3 className="kora-phone-title">Trouvez le talent adapté à votre projet</h3>
            <div className="kora-phone-search"><Search className="h-3.5 w-3.5" /><span>Rechercher un talent</span></div>
            <div className="kora-phone-row"><span>Explorer les catégories</span><span className="kora-phone-link">Tout voir</span></div>
            <div className="kora-phone-category-grid">
              {["Artistes", "Créateurs", "Influenceurs", "Sportifs"].map((item) => (
                <div className="kora-phone-category" key={item}><span className="kora-phone-category-mark" /><span>{item}</span></div>
              ))}
            </div>
            <div className="kora-phone-row"><span>Talents publiés</span><span className="kora-phone-link">Découvrir</span></div>
            {[1, 2].map((item) => (
              <div className="kora-phone-profile" key={item}>
                <span className="kora-phone-avatar"><UserRound className="h-4 w-4" /></span>
                <span className="kora-phone-skeleton"><i /><i /></span>
              </div>
            ))}
          </>
        ) : (
          <>
            <p className="kora-phone-eyebrow">ESPACE MANAGER</p>
            <h3 className="kora-phone-title">Gérez les talents que vous accompagnez</h3>
            <div className="kora-phone-create"><span>Créer un talent</span><span>+</span></div>
            <div className="kora-phone-manager-grid">
              <div><UserRound className="h-4 w-4" /><span>Mes talents</span></div>
              <div><FolderKanban className="h-4 w-4" /><span>Mes demandes</span></div>
            </div>
            <div className="kora-phone-row"><span>Profils gérés</span><span className="kora-phone-link">Voir tout</span></div>
            {[1, 2, 3].map((item) => (
              <div className="kora-phone-profile" key={item}>
                <span className="kora-phone-avatar"><UserRound className="h-4 w-4" /></span>
                <span className="kora-phone-skeleton"><i /><i /></span>
                <span className="kora-phone-status" />
              </div>
            ))}
            <div className="kora-phone-bottomline"><MessageCircle className="h-3.5 w-3.5" /><span>Messagerie et suivi des demandes</span></div>
          </>
        )}
      </div>
      <div className="kora-phone-home" />
    </div>
  )
}

export default function LandingHero() {
  const navigate = useNavigate()
  return (
    <section className="kora-landing-hero">
      <div className="kora-landing-hero-inner">
        <div className="kora-landing-phones" aria-label="Aperçus des espaces KORA">
          <div className="kora-phone-label">APERÇUS DE LA PLATEFORME</div>
          <PhoneFrame type="manager" />
          <PhoneFrame type="client" />
        </div>
        <div className="kora-landing-copy">
          <p className="kora-hero-eyebrow">LA PLATEFORME DES TALENTS AFRICAINS</p>
          <h1>Révélez les talents africains qui feront votre succès</h1>
          <p className="kora-hero-description">
            KORA connecte les talents africains exceptionnels avec les opportunités qui les méritent, en Afrique et au-delà. Explorez les profils réellement publiés sur KORA et contactez le manager du talent qui correspond à votre besoin.
          </p>
          <Button size="lg" onClick={() => navigate("/register")} className="kora-start-button">
            Commencer <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <a href="#kora-content" className="kora-scroll-cue"><ArrowDown className="h-4 w-4" /><span>Défiler pour en savoir plus</span></a>
    </section>
  )
}
