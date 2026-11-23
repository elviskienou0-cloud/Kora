import { Link, useNavigate } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import koraLogo from "@/assets/kora-logo.svg"
import { GlassBar, KButton } from "@/components/ui/KButton"
import { cn } from "@/lib/utils"
import { EASE, scrollToSection, useActiveSection } from "./landingKit.jsx"

/** Barre flottante : logo, ancres des sections, langue, connexion et appel à l'action. */
export default function LandingNav({ links, labels, language, onLanguageChange }) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const active = useActiveSection(links.map((l) => l.id))

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3">
      <motion.nav
        aria-label={labels.aria}
        initial={reduce ? false : { opacity: 0, y: -36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
        className="pointer-events-auto max-w-full"
      >
        <GlassBar className="flex items-center gap-1 rounded-full p-1.5 pl-3">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
            className="flex items-center gap-2 rounded-full pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="KORA"
          >
            <img src={koraLogo} alt="" className="h-7 w-7 rounded-lg" />
            <span className="hidden text-sm font-extrabold tracking-tight text-foreground sm:inline">KORA</span>
          </button>

          <ul className="mx-1 hidden items-center gap-0.5 md:flex">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection(link.id, reduce) }}
                  aria-current={active === link.id ? "true" : undefined}
                  className={cn(
                    "relative block rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active === link.id ? "text-foreground" : "text-foreground/60 hover:text-foreground"
                  )}
                >
                  {active === link.id && (
                    <motion.span
                      layoutId="kora-lp-nav-pill"
                      className="absolute inset-0 rounded-full bg-foreground/10"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onLanguageChange}
              aria-label={language === "fr" ? "Switch to English" : "Passer en français"}
              className="hidden rounded-full px-3 py-2 text-xs font-extrabold tracking-wider text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
            >
              {language === "fr" ? "EN" : "FR"}
            </button>
            <Link
              to="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
            >
              {labels.login}
            </Link>
            <KButton variant="gold" size="sm" arrow onClick={() => navigate("/register?role=manager")} className="rounded-full">
              <span className="hidden sm:inline">{labels.start}</span>
              <span className="sm:hidden">{labels.startShort}</span>
            </KButton>
          </div>
        </GlassBar>
      </motion.nav>
    </div>
  )
}
