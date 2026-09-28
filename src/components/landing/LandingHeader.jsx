import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  X,
  ChevronRight,
  LogIn,
  UserPlus,
  Home,
  Grid3X3,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils.js"
import useIsMobile from "@/hooks/use-mobile.jsx"
import koraLogo from "@/assets/kora-logo.svg"

const NAV_LINKS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/categories", label: "Catégories", icon: Grid3X3 },
  { href: "#talents", label: "Talents", icon: Users },
]

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "glass border-b border-border shadow-sm" : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-20 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <img src={koraLogo} alt="KORA" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain" />
              <span className="text-xl sm:text-2xl font-bold tracking-tight gold-text-gradient font-display">
                KORA
              </span>
            </Link>

            {!isMobile && (
              <nav className="flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              {!isMobile && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Connexion</span>
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-semibold gold-gradient text-white shadow-md shadow-gold/25 hover:shadow-gold/40 hover:opacity-95 transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Inscription</span>
                    <ChevronRight className="h-4 w-4 -mr-1" />
                  </Link>
                </>
              )}

              {isMobile && (
                <button
                  onClick={() => setMobileOpen(true)}
                  className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-background border-l border-border flex flex-col"
            >
              <div className="h-16 px-5 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xl font-bold gold-text-gradient font-display">KORA</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {NAV_LINKS.map((link, i) => (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => {
                      navigate(link.href)
                      setMobileOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <link.icon className="h-5 w-5 text-gold" />
                    <span>{link.label}</span>
                  </motion.button>
                ))}
              </nav>

              <div className="p-4 border-t border-border space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border font-medium hover:bg-accent transition-colors"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Connexion</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl gold-gradient text-white font-semibold shadow-md shadow-gold/25"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Créer un compte</span>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
