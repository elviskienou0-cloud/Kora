import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X, LogIn, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils.js"
import useIsMobile from "@/hooks/use-mobile.jsx"
import koraLogo from "@/assets/kora-logo.svg"

const NAV_LINKS = [
  { href: "/", label: "Accueil", type: "route" },
  { href: "/faq", label: "FAQ", type: "route" },
  { href: "#pricing", label: "Abonnement", type: "anchor" },
]

export default function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()
  const navigate = useNavigate()

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
        window.setTimeout(() => document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" }), 100)
      } else {
        document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" })
      }
      return
    }
    navigate(link.href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#090909] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-[76px] flex items-center justify-between gap-5">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="KORA, accueil">
            <img src={koraLogo} alt="" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">KORA</span>
          </Link>

          {!isMobile && (
            <>
              <nav aria-label="Navigation principale" className="flex items-center gap-8">
                {NAV_LINKS.map((link) => (
                  link.type === "anchor" ? (
                    <a key={link.href} href={link.href} className="text-sm font-medium text-white/80 hover:text-[#e8b72d] transition-colors">
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.href} to={link.href} className="text-sm font-medium text-white/80 hover:text-[#e8b72d] transition-colors">
                      {link.label}
                    </Link>
                  )
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <Link to="/login" className="inline-flex items-center gap-2 rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white hover:border-[#e8b72d] hover:text-[#e8b72d] transition-colors">
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </Link>
                <Link to="/register" className="inline-flex items-center gap-2 rounded-md bg-[#e8b72d] px-4 py-2 text-sm font-semibold text-[#111] hover:bg-[#f0c94f] transition-colors">
                  <UserPlus className="h-4 w-4" />
                  S'inscrire
                </Link>
              </div>
            </>
          )}

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-md p-2 text-white hover:bg-white/10"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </div>

      {isMobile && mobileOpen && (
        <div className="border-t border-white/10 bg-[#090909] px-4 py-4 shadow-xl">
          <nav aria-label="Navigation mobile" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button key={link.href} type="button" onClick={() => goToLink(link)} className="rounded-md px-3 py-3 text-left text-sm font-medium text-white/85 hover:bg-white/5 hover:text-[#e8b72d]">
                {link.label}
              </button>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
            <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-md border border-white/25 px-3 py-3 text-sm font-medium text-white">
              <LogIn className="h-4 w-4" /> Se connecter
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-md bg-[#e8b72d] px-3 py-3 text-sm font-semibold text-[#111]">
              <UserPlus className="h-4 w-4" /> S'inscrire
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
