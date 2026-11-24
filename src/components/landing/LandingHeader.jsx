import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X, LogIn, UserPlus } from "lucide-react"
import useIsMobile from "@/hooks/use-mobile.jsx"
import { LanguageSwitcher, useI18n } from "@/i18n/kora-i18n.jsx"
import koraLogo from "@/assets/kora-logo.svg"
import ThemeToggle from "@/components/ThemeToggle.jsx"

const NAV_LINKS = [
  { href: "/categories", label: "Catégories", en: "Categories", type: "route" },
  { href: "#pricing", label: "Abonnement", en: "Pricing", type: "anchor" },
  { href: "/faq", label: "FAQ", en: "FAQ", type: "route" },
  { href: "/contact", label: "Contact", en: "Contact", type: "route" },
]

export default function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { language } = useI18n()
  const isEnglish = language === "en"

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [])

  const goToLink = (link) => {
    setMobileOpen(false)
    if (link.type === "anchor") {
      if (window.location.pathname !== "/") {
        navigate("/")
        window.setTimeout(() => document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" }), 120)
      } else {
        document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" })
      }
      return
    }
    navigate(link.href)
  }

  const linkLabel = (link) => isEnglish ? link.en : link.label

  return (
    <header className="kora-glass-header">
      <div className="kora-glass-header-inner">
        <Link to="/" className="kora-brand-link" aria-label="KORA, accueil">
          <img src={koraLogo} alt="" className="kora-brand-logo" />
          <span>KORA</span>
        </Link>

        {!isMobile && (
          <>
            <nav aria-label="Navigation principale" className="kora-glass-nav">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={link.type === "anchor" ? (event) => { event.preventDefault(); goToLink(link) } : undefined}
                  className="kora-glass-nav-link"
                >
                  {linkLabel(link)}
                </a>
              ))}
            </nav>

            <div className="kora-header-actions">
              <ThemeToggle />
              <LanguageSwitcher compact showLabel className="kora-language-switcher" />
              <Link to="/login" className="kora-login-link">
                <LogIn className="h-4 w-4" />
                {isEnglish ? "Log in" : "Se connecter"}
              </Link>
              <Link to="/register" className="kora-register-link">
                <UserPlus className="h-4 w-4" />
                {isEnglish ? "Sign up" : "S'inscrire"}
              </Link>
            </div>
          </>
        )}

        {isMobile && (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher compact showLabel className="kora-language-switcher" />
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-xl border border-border/70 bg-background/70 p-2 text-foreground backdrop-blur-xl"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>

      {isMobile && mobileOpen && (
        <div className="kora-mobile-glass-menu">
          <nav aria-label="Navigation mobile" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button key={link.href} type="button" onClick={() => goToLink(link)} className="kora-mobile-nav-link">
                {linkLabel(link)}
              </button>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-4">
            <Link to="/login" onClick={() => setMobileOpen(false)} className="kora-login-link justify-center">
              <LogIn className="h-4 w-4" /> {isEnglish ? "Log in" : "Se connecter"}
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)} className="kora-register-link justify-center">
              <UserPlus className="h-4 w-4" /> {isEnglish ? "Sign up" : "S'inscrire"}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
