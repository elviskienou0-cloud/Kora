import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Heart,
} from "lucide-react"
import { cn } from "@/lib/utils.js"
import koraLogo from "@/assets/kora-logo.svg"

const FOOTER_LINKS = {
  Plateforme: [
    { label: "Accueil", href: "/" },
    { label: "Catégories", href: "/categories" },
    { label: "Devenir Manager", href: "/register?role=manager" },
    { label: "Tarifs", href: "#pricing" },
  ],
  Support: [
    { label: "Centre d'aide", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Signaler un problème", href: "/signaler-un-probleme" },
  ],
  Légal: [
    { label: "Conditions d'utilisation", href: "/conditions" },
    { label: "Politique de confidentialité", href: "/confidentialite" },
    { label: "Cookies", href: "/cookies" },
    { label: "Mentions légales", href: "/mentions-legales" },
  ],
}

const SOCIAL_LINKS = [] // Réseaux sociaux masqués tant que les URLs officielles ne sont pas configurées
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
]

export default function LandingFooter() {
  return (
    <footer className="relative border-t border-border bg-card/50 mt-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* =========================
              KORA / CONTACT
          ========================== */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 group mb-5">
              <img src={koraLogo} alt="KORA" className="w-11 h-11 rounded-2xl object-contain" />

              <span className="text-2xl font-bold tracking-tight gold-text-gradient font-display">
                KORA
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              La plateforme africaine qui connecte les clients avec les meilleurs
              talents indépendants. Réalisez vos projets avec excellence.
            </p>

            <div className="space-y-3 text-sm">

              <div className="flex items-start gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 text-gold shrink-0" />
                <span>kora.contact@gmail.com</span>
              </div>

              <div className="flex items-start gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 text-gold shrink-0" />
                <span>+226 70 27 18 10</span>
              </div>

              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-gold shrink-0" />
                <span>Ouagadougou, Burkina Faso</span>
              </div>

            </div>

            {/* =========================
                RÉSEAUX SOCIAUX
            ========================== */}
            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                  className={cn(
                    "w-10 h-10 rounded-xl border border-border flex items-center justify-center",
                    "text-muted-foreground hover:text-foreground hover:border-gold/50 hover:bg-gold/10",
                    "transition-all duration-200"
                    
                  )}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* =========================
              FOOTER LINKS
          ========================== */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-foreground mb-4">
                {title}
              </h4>

              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>

                    {/* Les liens internes utilisent React Router.
                        Les liens avec # restent des ancres internes. */}
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-gold transition-colors inline-flex items-center gap-1 group"
                      >
                        <span className="w-0 group-hover:w-1 h-0.5 bg-gold rounded-full transition-all" />
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-gold transition-colors inline-flex items-center gap-1 group"
                      >
                        <span className="w-0 group-hover:w-1 h-0.5 bg-gold rounded-full transition-all" />
                        {link.label}
                      </Link>
                    )}

                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* =========================
            COPYRIGHT
        ========================== */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">

          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            © {new Date().getFullYear()} KORA. Fait avec
            <Heart
              className="h-3.5 w-3.5 text-red-500 fill-current"
            />
            en Afrique.
          </p>

          <p className="text-sm text-muted-foreground">
            Tous droits réservés.
          </p>

        </div>
      </div>
    </footer>
  )
}
