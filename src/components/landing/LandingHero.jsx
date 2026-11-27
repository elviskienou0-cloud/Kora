import { useNavigate } from "react-router-dom"
import { ArrowRight, BriefcaseBusiness, Search, Users, ShieldCheck, MessageCircle, FolderKanban } from "lucide-react"
import { KButton } from "@/components/ui/KButton"
import { useI18n } from "@/i18n/kora-i18n.jsx"

export default function LandingHero() {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const en = language === "en"

  return (
    <section className="kora-landing-hero kora-spotlight-hero kora-final-hero" aria-labelledby="kora-hero-title">
      <div className="kora-spotlight-beams" aria-hidden="true"><i /><i /><i /></div>
      <div className="kora-final-hero-grid">
        <div className="kora-final-hero-copy">
          <p className="kora-spotlight-pill"><span />{t("landing.heroEyebrow")}</p>
          <h1 id="kora-hero-title">
            {en ? "African talent. Professional connections. Real opportunities." : "Les talents africains. Les bonnes connexions. De vraies opportunités."}
          </h1>
          <p className="kora-hero-description">{t("landing.heroDescription")}</p>
          <div className="kora-spotlight-actions kora-final-hero-actions">
            <KButton size="lg" arrow onClick={() => navigate("/categories")} className="kora-spotlight-primary">
              {t("landing.discoverTalents")}
            </KButton>
            <button type="button" onClick={() => navigate("/register")} className="kora-spotlight-secondary">
              {en ? "Join KORA" : "Rejoindre KORA"} <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="kora-spotlight-proof">
            <span><ShieldCheck aria-hidden="true" />{en ? "Manager-led talent profiles" : "Profils de talents gérés par des managers"}</span>
            <span><MessageCircle aria-hidden="true" />{en ? "Structured communication" : "Échanges structurés"}</span>
          </div>
        </div>

        <div className="kora-phone-stage" aria-label={en ? "KORA mobile app preview" : "Aperçu de KORA sur téléphone"}>
          <div className="kora-phone-glow" aria-hidden="true" />
          <div className="kora-phone-frame">
            <div className="kora-phone-camera" aria-hidden="true" />
            <div className="kora-phone-screen">
              <div className="kora-phone-status"><span>KORA</span><span>9:41</span></div>
              <div className="kora-phone-brand"><span className="kora-phone-mark">K</span><strong>KORA</strong><span className="kora-phone-language">FR</span></div>
              <div className="kora-phone-welcome">
                <small>{en ? "YOUR TALENT SPACE" : "VOTRE ESPACE TALENTS"}</small>
                <h2>{en ? "Find the right talent" : "Trouvez le bon talent"}</h2>
                <p>{en ? "Explore profiles and connect with their managers." : "Explorez les profils et échangez avec leurs managers."}</p>
              </div>
              <div className="kora-phone-search"><Search size={15} /><span>{en ? "Search for a talent" : "Rechercher un talent"}</span></div>
              <div className="kora-phone-section-title"><strong>{en ? "Explore categories" : "Explorer les catégories"}</strong><span>{en ? "View all" : "Tout voir"}</span></div>
              <div className="kora-phone-category-grid">
                <div><span><BriefcaseBusiness size={17}/></span><small>{en ? "Business" : "Business"}</small></div>
                <div><span><Users size={17}/></span><small>{en ? "Influence" : "Influence"}</small></div>
                <div><span><FolderKanban size={17}/></span><small>{en ? "Events" : "Événementiel"}</small></div>
                <div><span><MessageCircle size={17}/></span><small>{en ? "Creative" : "Créatif"}</small></div>
              </div>
              <div className="kora-phone-bottom">
                <span className="is-active"><Search size={16}/><small>{en ? "Explore" : "Explorer"}</small></span>
                <span><Users size={16}/><small>{en ? "Account" : "Compte"}</small></span>
              </div>
            </div>
          </div>
          <div className="kora-phone-caption"><span />{en ? "KORA, in your pocket" : "KORA, partout avec vous"}</div>
        </div>
      </div>
    </section>
  )
}
