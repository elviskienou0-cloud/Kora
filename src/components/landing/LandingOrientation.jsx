import { useNavigate } from "react-router-dom"
import { ArrowRight, BriefcaseBusiness, Search } from "lucide-react"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { Reveal } from "./landingKit.jsx"

export default function LandingOrientation() {
  const navigate = useNavigate()
  const { language } = useI18n()
  const en = language === "en"

  return (
    <section className="kora-lp-section kora-final-orientation" aria-labelledby="orientation-title">
      <div className="kora-lp-container">
        <Reveal>
          <div className="kora-final-orientation-card">
            <div className="kora-final-orientation-heading">
              <p>{en ? "GET STARTED WITH KORA" : "COMMENCEZ AVEC KORA"}</p>
              <h2 id="orientation-title">{en ? "What brings you to KORA?" : "Que souhaitez-vous faire sur KORA ?"}</h2>
            </div>
            <div className="kora-final-orientation-options">
              <button type="button" onClick={() => navigate("/register?role=manager")}>
                <span className="kora-final-orientation-icon"><BriefcaseBusiness size={23}/></span>
                <span><strong>Manager</strong><small>{en ? "Manage, represent and develop your talents." : "Gérer, représenter et développer vos talents."}</small></span>
                <ArrowRight size={20}/>
              </button>
              <button type="button" onClick={() => navigate("/register?role=client")}>
                <span className="kora-final-orientation-icon"><Search size={23}/></span>
                <span><strong>Client</strong><small>{en ? "Discover talents and bring your projects to life." : "Découvrir des talents et concrétiser vos projets."}</small></span>
                <ArrowRight size={20}/>
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
