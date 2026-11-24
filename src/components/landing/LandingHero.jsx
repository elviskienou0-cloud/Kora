import { Link, useNavigate } from "react-router-dom"
import { Bell, CheckCircle2, FolderKanban, MessageCircle, Search, ShieldCheck, UserRound, Users } from "lucide-react"
import { KButton } from "@/components/ui/KButton"
import { useI18n } from "@/i18n/kora-i18n.jsx"

function PhoneFrame({ type, t }) {
  const isClient = type === "client"

  return (
    <div className={isClient ? "kora-phone kora-phone-client" : "kora-phone kora-phone-manager"}>
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
            <div className="kora-phone-search"><Search className="h-3.5 w-3.5" aria-hidden="true" /><span>{t("landing.searchTalent")}</span></div>
            <div className="kora-phone-row"><span>{t("landing.exploreCategories")}</span><span className="kora-phone-link">{t("landing.seeAll")}</span></div>
            <div className="kora-phone-category-grid">
              {[t("landing.phoneArtists"), t("landing.phoneCreators"), t("landing.phoneInfluencers"), t("landing.phoneAthletes")].map((item) => (
                <div className="kora-phone-category" key={item}><span className="kora-phone-category-mark" /><span>{item}</span></div>
              ))}
            </div>
            <div className="kora-phone-row"><span>{t("landing.publishedTalents")}</span><span className="kora-phone-link">{t("landing.discover")}</span></div>
            {[1, 2].map((item) => (
              <div className="kora-phone-profile" key={item}>
                <span className="kora-phone-avatar"><UserRound className="h-4 w-4" aria-hidden="true" /></span>
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
              <div><UserRound className="h-4 w-4" aria-hidden="true" /><span>{t("landing.myTalents")}</span></div>
              <div><FolderKanban className="h-4 w-4" aria-hidden="true" /><span>{t("landing.myRequests")}</span></div>
            </div>
            <div className="kora-phone-row"><span>{t("landing.managedProfiles")}</span><span className="kora-phone-link">{t("landing.viewAllProfiles")}</span></div>
            {[1, 2, 3].map((item) => (
              <div className="kora-phone-profile" key={item}>
                <span className="kora-phone-avatar"><UserRound className="h-4 w-4" aria-hidden="true" /></span>
                <span className="kora-phone-skeleton"><i /><i /></span>
                <span className="kora-phone-status" />
              </div>
            ))}
            <div className="kora-phone-bottomline"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /><span>{t("landing.messagesAndRequests")}</span></div>
          </>
        )}
      </div>
      <div className="kora-phone-home" />
    </div>
  )
}

export default function LandingHero() {
  const navigate = useNavigate()
  const { t, language } = useI18n()

  return (
    <section className="kora-landing-hero" aria-labelledby="kora-hero-title">
      <div className="kora-landing-hero-inner">
        <div className="kora-landing-copy">
          <p className="kora-hero-eyebrow">{t("landing.heroEyebrow")}</p>
          <h1 id="kora-hero-title">{t("landing.heroTitle")}</h1>
          <p className="kora-hero-description">{t("landing.heroDescription")}</p>
          <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <KButton size="lg" arrow onClick={() => navigate("/categories")} className="kora-start-button min-h-12">
              {t("landing.discoverTalents")}
            </KButton>
            <Link
              to="/register?role=manager"
              className="inline-flex min-h-12 items-center gap-2 rounded-full px-2 text-sm font-bold text-[#171717]/75 underline-offset-4 hover:text-[#171717] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a77c0c]"
            >
              {t("landing.audienceManagerCta")}
            </Link>
          </div>
          <div className="kora-hero-proof" aria-label={language === "en" ? "KORA platform benefits" : "Atouts de la plateforme KORA"}>
            <span><CheckCircle2 aria-hidden="true" />{language === "en" ? "Profiles managed by managers" : "Profils gérés par des managers"}</span>
            <span><ShieldCheck aria-hidden="true" />{language === "en" ? "Structured requests" : "Demandes structurées"}</span>
            <span><Users aria-hidden="true" />{language === "en" ? "Clients and talent teams" : "Clients et équipes de talents"}</span>
          </div>
        </div>

        <div className="kora-landing-phones" aria-hidden="true">
          <div className="kora-phone-label">{language === "en" ? "ILLUSTRATIVE PREVIEW" : "APERÇU ILLUSTRATIF"}</div>
          <PhoneFrame type="manager" t={t} />
          <PhoneFrame type="client" t={t} />
        </div>
      </div>
    </section>
  )
}
