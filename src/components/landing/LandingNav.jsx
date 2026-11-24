import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, X } from "lucide-react"
import koraLogo from "@/assets/kora-logo.svg"
import { KButton } from "@/components/ui/KButton"
import { cn } from "@/lib/utils"
import { scrollToSection, useActiveSection } from "./landingKit.jsx"
import ThemeToggle from "@/components/ThemeToggle.jsx"

export default function LandingNav({ links, labels, language, onLanguageChange }) {
  const navigate = useNavigate()
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const [menuOpen, setMenuOpen] = useState(false)
  const [navHidden, setNavHidden] = useState(false)
  const navShellRef = useRef(null)
  const active = useActiveSection(links.map((link) => link.id))

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [menuOpen])

  useEffect(() => {
    if (reduce) return undefined
    let previousY = window.scrollY
    let frame = 0

    const updateDirection = () => {
      frame = 0
      const currentY = window.scrollY
      const navHasFocus = navShellRef.current?.contains(document.activeElement)

      if (menuOpen || navHasFocus || currentY < 120) {
        setNavHidden(false)
      } else if (currentY > previousY + 6) {
        setNavHidden(true)
      } else if (currentY < previousY - 6) {
        setNavHidden(false)
      }

      previousY = currentY
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateDirection)
    }
    const onFocus = () => setNavHidden(false)

    window.addEventListener("scroll", onScroll, { passive: true })
    navShellRef.current?.addEventListener("focusin", onFocus)
    return () => {
      window.removeEventListener("scroll", onScroll)
      navShellRef.current?.removeEventListener("focusin", onFocus)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [menuOpen, reduce])

  const followSection = (event, id) => {
    event.preventDefault()
    scrollToSection(id, reduce)
    setMenuOpen(false)
  }

  const languageButton = (
    <button
      type="button"
      onClick={onLanguageChange}
      aria-label={language === "fr" ? "Switch to English" : "Passer en français"}
      className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full px-3 text-xs font-extrabold tracking-wider text-foreground/75 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {language === "fr" ? "EN" : "FR"}
    </button>
  )

  return (
    <div ref={navShellRef} className={cn("kora-lp-nav-wrapper pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3", navHidden && !menuOpen && "is-hidden")}>
      <nav
        aria-label={labels.aria}
        className="pointer-events-auto w-full max-w-6xl"
      >
        <div className="kora-lp-nav-shell flex min-h-14 items-center gap-1 rounded-full border border-border bg-background/95 p-1.5 pl-3 shadow-lg">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
            className="flex min-h-12 shrink-0 items-center gap-2 rounded-full pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="KORA, accueil"
          >
            <img src={koraLogo} alt="" width="28" height="28" className="h-7 w-7 rounded-lg" />
            <span className="hidden text-sm font-extrabold tracking-tight text-foreground sm:inline">KORA</span>
          </button>

          <ul className="mx-auto hidden items-center gap-0.5 lg:flex">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={"#" + link.id}
                  onClick={(event) => followSection(event, link.id)}
                  aria-current={active === link.id ? "location" : undefined}
                  className={cn(
                    "block rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active === link.id ? "bg-muted text-foreground" : "text-foreground/65 hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <ThemeToggle />
            {languageButton}
            <Link
              to="/login"
              className="hidden min-h-12 items-center rounded-full px-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              {labels.login}
            </Link>
            <KButton
              variant="gold"
              size="md"
              onClick={() => navigate("/categories")}
              className="min-h-12 px-4"
            >
              <span className="hidden sm:inline">{labels.start}</span>
              <span className="sm:hidden">{labels.startShort}</span>
            </KButton>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? labels.closeMenu : labels.openMenu}
              aria-expanded={menuOpen}
              aria-controls="kora-mobile-nav"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div id="kora-mobile-nav" hidden={!menuOpen} className="mt-2 rounded-2xl border border-border bg-background p-3 shadow-xl lg:hidden">
            <ul className="grid gap-1">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={"#" + link.id}
                    onClick={(event) => followSection(event, link.id)}
                    aria-current={active === link.id ? "location" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active === link.id ? "bg-muted text-foreground" : "text-foreground/75 hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="border-t border-border pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold hover:bg-muted">
                  {labels.login}
                </Link>
              </li>
              <li>
                <Link to="/register?role=manager" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold text-primary hover:bg-muted">
                  {labels.manager}
                </Link>
              </li>
            </ul>
        </div>
      </nav>
    </div>
  )
}
