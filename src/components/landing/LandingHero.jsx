import { useNavigate } from "react-router-dom"
import {
  ArrowDown,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  FolderKanban,
  MessageCircle,
  Search,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"

function PhoneFrame({ type }) {
  const isClient = type === "client"

  return (
    <div className="kora-phone" aria-label={isClient ? "Aperçu de l'espace Client" : "Aperçu de l'espace Manager"}>
      <div className="kora-phone-notch" />
      <div className="kora-phone-screen">
        <div className="flex items-center justify-between mb-5">
          <span className="text-base font-black tracking-tight text-white">
            <span className="text-[#e8b72d]">K</span>ORA
          </span>
          <Bell className="h-4 w-4 text-white/65" />
        </div>

        {isClient ? (
          <>
            <p className="text-[11px] text-white/55 mb-1">Espace Client</p>
            <h3 className="text-[17px] leading-tight font-bold text-white mb-3">
              Trouvez le talent adapté à votre projet
            </h3>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 border border-white/10 px-2.5 py-2 mb-4">
              <Search className="h-3.5 w-3.5 text-white/45" />
              <span className="text-[9px] text-white/45">Rechercher un talent</span>
            </div>
            <p className="text-[10px] font-semibold text-white/85 mb-2">Explorer les catégories</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["Artistes", "Créateurs", "Influenceurs", "Sportifs"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2.5">
                  <div className="h-5 w-5 rounded-md bg-[#e8b72d]/15 mb-1.5" />
                  <span className="text-[9px] text-white/80">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-white/85">Talents publiés</span>
              <span className="text-[8px] text-[#e8b72d]">Découvrir</span>
            </div>
            <div className="space-y-2">
              {[1, 2].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-white/[0.05] p-2">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    <UserRound className="h-4 w-4 text-white/55" />
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 w-16 rounded bg-white/55 mb-1.5" />
                    <div className="h-1 w-11 rounded bg-white/20" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] text-white/55 mb-1">Espace Manager</p>
            <h3 className="text-[17px] leading-tight font-bold text-white mb-3">
              Gérez vos talents et vos activités
            </h3>
            <div className="rounded-lg bg-[#e8b72d] text-[#171717] px-3 py-2.5 flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold">Créer un talent</span>
              <span className="text-base leading-none">+</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2.5">
                <UserRound className="h-4 w-4 text-[#e8b72d] mb-2" />
                <span className="block text-[9px] text-white/55">Mes talents</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2.5">
                <FolderKanban className="h-4 w-4 text-[#e8b72d] mb-2" />
                <span className="block text-[9px] text-white/55">Mes demandes</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-white/85">Profils gérés</span>
              <span className="text-[8px] text-[#e8b72d]">Voir tout</span>
            </div>
            <div className="space-y-2 mb-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-white/[0.05] p-2">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    <UserRound className="h-4 w-4 text-white/55" />
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 w-16 rounded bg-white/55 mb-1.5" />
                    <div className="h-1 w-10 rounded bg-white/20" />
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-white/10 pt-3 text-white/50">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="text-[9px]">Messagerie et suivi des demandes</span>
            </div>
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
        <div className="kora-landing-phones">
          <div className="kora-phone-label">ESPACE CLIENT</div>
          <PhoneFrame type="client" />
          <div className="kora-phone-label kora-manager-label">ESPACE MANAGER</div>
          <PhoneFrame type="manager" />
        </div>

        <div className="kora-landing-copy">
          <div className="kora-wordmark" aria-label="KORA">
            <span>K</span>ORA
          </div>
          <p className="kora-tagline">CONNECT · COLLABORATE · SHINE</p>
          <h1>
            Révélez les talents <span>africains</span> qui feront votre succès
          </h1>
          <p className="kora-hero-description">
            KORA connecte les talents africains exceptionnels avec les opportunités qui les méritent, en Afrique et au-delà. Explorez les profils réellement publiés sur KORA et contactez le manager du talent qui correspond à votre besoin.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/register")}
            className="kora-start-button"
          >
            Commencer <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <a href="#kora-content" className="kora-scroll-cue">
        <ArrowDown className="h-4 w-4" />
        <span>Défiler pour en savoir plus</span>
      </a>
    </section>
  )
}
