import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X } from "lucide-react"
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
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:px-5">
      <header className="pointer-events-auto w-full max-w-6xl">
        <div className="flex min-h-14 items-center gap-1 rounded-full border border-border bg-background/95 p-1.5 pl-3 shadow-lg backdrop-blur-2xl sm:gap-2 sm:pl-4">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex min-h-12 shrink-0 items-center gap-2 rounded-full pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="KORA, accueil"
          >
            <img src={koraLogo} alt="" width="28" height="28" className="h-7 w-7 rounded-lg" />
            <span className="hidden text-sm font-extrabold tracking-tight text-foreground sm:inline">KORA</span>
          </Link>

          {!isMobile && (
            <nav aria-label="Navigation principale" className="mx-auto flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={link.type === "anchor" ? (event) => { event.preventDefault(); goToLink(link) } : undefined}
                  className="block rounded-full px-3 py-2 text-sm font-semibold text-foreground/65 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {linkLabel(link)}
                </a>
              ))}
            </nav>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher compact showLabel className="kora-language-switcher" />
            {!isMobile && (
              <>
                <Link
                  to="/login"
                  className="hidden min-h-12 items-center rounded-full px-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
                >
                  {isEnglish ? "Log in" : "Se connecter"}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isEnglish ? "Sign up" : "S'inscrire"}
                </Link>
              </>
            )}
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={mobileOpen}
                aria-controls="kora-public-mobile-nav"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {isMobile && mobileOpen && (
          <div id="kora-public-mobile-nav" className="mt-2 rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur-2xl">
            <nav aria-label="Navigation mobile" className="grid gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => goToLink(link)}
                  className="flex min-h-12 items-center rounded-xl px-4 text-left text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted"
                >
                  {linkLabel(link)}
                </button>
              ))}
            </nav>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center justify-center rounded-full border border-border px-3 text-sm font-semibold">
                {isEnglish ? "Log in" : "Se connecter"}
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center justify-center rounded-full bg-primary px-3 text-sm font-bold text-primary-foreground">
                {isEnglish ? "Sign up" : "S'inscrire"}
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  )
}
