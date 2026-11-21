import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Heart } from "lucide-react"
import { cn } from "@/lib/utils.js"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import koraLogo from "@/assets/kora-logo.svg"

const FOOTER_LINKS = {
  footerPlatform: [
    { label: "footerHome", href: "/" },
    { label: "footerCategories", href: "/categories" },
    { label: "footerBecomeManager", href: "/register?role=manager" },
    { label: "footerPricing", href: "/#pricing" },
  ],
  footerSupport: [
    { label: "footerHelp", href: "/faq" },
    { label: "footerContact", href: "/contact" },
    { label: "footerFaq", href: "/faq" },
    { label: "footerReport", href: "/signaler-un-probleme" },
  ],
  footerLegal: [
    { label: "footerTerms", href: "/conditions" },
    { label: "footerPrivacy", href: "/confidentialite" },
    { label: "footerCookies", href: "/cookies" },
    { label: "footerSalesTerms", href: "/cgv" },
    { label: "footerLegalNotice", href: "/mentions-legales" },
  ],
}

const SOCIAL_LINKS = []

export default function LandingFooter() {
  const { t } = useI18n()
  return (
    <footer className="relative border-t border-border bg-card/50 mt-20 kora-public-footer">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 group mb-5">
              <img src={koraLogo} alt="KORA" className="w-11 h-11 rounded-2xl object-contain" />
              <span className="text-2xl font-bold tracking-tight gold-text-gradient font-display">KORA</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              {t("landing.footerDescription")}
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>kora.contact1@gmail.com</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>+226 70 27 18 10</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>Ouagadougou, Burkina Faso</span>
              </div>
            </div>
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
                    "text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/10",
                    "transition-all duration-200"
                  )}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>
          {Object.entries(FOOTER_LINKS).map(([titleKey, links]) => (
            <div key={titleKey}>
              <h4 className="font-semibold text-foreground mb-4">{t(`landing.${titleKey}`)}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                      >
                        <span className="w-0 group-hover:w-1 h-0.5 bg-primary rounded-full transition-all" />
                        {t(`landing.${link.label}`)}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                      >
                        <span className="w-0 group-hover:w-1 h-0.5 bg-primary rounded-full transition-all" />
                        {t(`landing.${link.label}`)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            © {new Date().getFullYear()} KORA. {t("landing.footerMadeWith")}
            <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
            {t("landing.footerInAfrica")}
          </p>
          <p className="text-sm text-muted-foreground">{t("landing.footerRights")}</p>
        </div>
      </div>
    </footer>
  )
}
