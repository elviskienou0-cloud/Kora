import { useNavigate } from "react-router-dom"
import { ArrowRight, Bell, FolderKanban, MessageCircle, Search, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/kora-i18n.jsx"

function PhoneFrame({ type, t }) {
  const isClient = type === "client"
  return (
    <div className={isClient ? "kora-phone kora-phone-client" : "kora-phone kora-phone-manager"} aria-label={isClient ? t("landing.clientSpace") : t("landing.managerSpace")}>
      <div className="kora-phone-notch" />
      <div className="kora-phone-screen">
        <div className="kora-phone-topbar">
          <span className="kora-phone-brand"><span>K</span>ORA</span>
          <Bell className="h-4 w-4" aria-hidden="true" />
        </div>
        {isClient ? (
          <>
            <p className="kora-phone-eyebrow">{t("landing.clientSpace")}</p>
            <h3 className="kora-phone-title">{t("landing.clientPreviewTitle")}</h3>
            <div className="kora-phone-search"><Search className="h-3.5 w-3.5" /><span>{t("landing.searchTalent")}</span></div>
            <div className="kora-phone-row"><span>{t("landing.exploreCategories")}</span><span className="kora-phone-link">{t("landing.seeAll")}</span></div>
            <div className="kora-phone-category-grid">
              {["Artistes", "Créateurs", "Influenceurs", "Sportifs"].map((item) => (
                <div className="kora-phone-category" key={item}><span className="kora-phone-category-mark" /><span>{item}</span></div>
              ))}
            </div>
            <div className="kora-phone-row"><span>{t("landing.publishedTalents")}</span><span className="kora-phone-link">{t("landing.discover")}</span></div>
            {[1, 2].map((item) => (
              <div className="kora-phone-profile" key={item}>
                <span className="kora-phone-avatar"><UserRound className="h-4 w-4" /></span>
                <span className="kora-phone-skeleton"><i /><i /></span>
              </div>
            ))}
          </>
        ) : (
          <>
            <p className="kora-phone-eyebrow">{t("landing.managerSpace")}</p>
            <h3 className="kora-phone-title">{t("landing.managerPreviewTitle")}</h3>
            <div className="kora-phone-create"><span>{t("landing.createTalent")}</span><span>+</span></div>
            <div className="kora-phone-manager-grid">
              <div><UserRound className="h-4 w-4" /><span>{t("landing.myTalents")}</span></div>
              <div><FolderKanban className="h-4 w-4" /><span>{t("landing.myRequests")}</span></div>
            </div>
            <div className="kora-phone-row"><span>{t("landing.managedProfiles")}</span><span className="kora-phone-link">{t("landing.viewAllProfiles")}</span></div>
            {[1, 2, 3].map((item) => (
              <div className="kora-phone-profile" key={item}>
                <span className="kora-phone-avatar"><UserRound className="h-4 w-4" /></span>
                <span className="kora-phone-skeleton"><i /><i /></span>
                <span className="kora-phone-status" />
              </div>
            ))}
            <div className="kora-phone-bottomline"><MessageCircle className="h-3.5 w-3.5" /><span>{t("landing.messagesAndRequests")}</span></div>
          </>
        )}
      </div>
      <div className="kora-phone-home" />
    </div>
  )
}

export default function LandingHero() {
  const navigate = useNavigate()
  const { t } = useI18n()
  return (
    <section className="kora-landing-hero">
      <div className="kora-landing-hero-inner">
        <div className="kora-landing-phones" aria-label={t("landing.platformPreview")}>
          <div className="kora-phone-label">{t("landing.platformPreview")}</div>
          <PhoneFrame type="manager" t={t} />
          <PhoneFrame type="client" t={t} />
        </div>
        <div className="kora-landing-copy">
          <p className="kora-hero-eyebrow">{t("landing.heroEyebrow")}</p>
          <h1>{t("landing.heroTitle")}</h1>
          <p className="kora-hero-description">{t("landing.heroDescription")}</p>
          <Button size="lg" onClick={() => navigate("/register")} className="kora-start-button">
            {t("landing.getStarted")} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
