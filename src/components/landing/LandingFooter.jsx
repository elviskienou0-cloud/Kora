import { Link } from "react-router-dom"
import { Mail, MapPin, Phone, Heart } from "lucide-react"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import koraLogo from "@/assets/kora-logo.svg"

export default function LandingFooter() {
  const { t } = useI18n()
  const sections = [
    {
      title: t("landing.footerPlatform"),
      links: [
        { label: t("landing.footerHome"), href: "/" },
        { label: t("landing.footerCategories"), href: "/categories" },
        { label: t("landing.footerBecomeManager"), href: "/register?role=manager" },
        { label: t("landing.footerPricing"), href: "#pricing" },
      ],
    },
    {
      title: t("landing.footerSupport"),
      links: [
        { label: t("landing.footerContact"), href: "/contact" },
        { label: t("landing.footerFaq"), href: "/faq" },
        { label: t("landing.footerReport"), href: "/signaler-un-probleme" },
      ],
    },
    {
      title: t("landing.footerLegal"),
      links: [
        { label: t("landing.footerTerms"), href: "/conditions" },
        { label: t("landing.footerPrivacy"), href: "/confidentialite" },
        { label: t("landing.footerCookies"), href: "/cookies" },
        { label: t("landing.footerSalesTerms"), href: "/cgv" },
        { label: t("landing.footerLegalNotice"), href: "/mentions-legales" },
      ],
    },
  ]

  return (
    <footer className="kora-public-footer relative border-t border-border bg-card/60">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-9 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:gap-8 lg:px-8">
        <div className="lg:col-span-2">
          <Link to="/" className="mb-4 inline-flex min-h-12 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={koraLogo} alt="KORA" width="40" height="40" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-2xl font-extrabold tracking-tight text-foreground">KORA</span>
          </Link>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">{t("landing.footerDescription")}</p>

          <address className="space-y-3 text-sm not-italic">
            <a href="mailto:kora.contact1@gmail.com" className="flex min-h-10 items-center gap-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              kora.contact1@gmail.com
            </a>
            <a href="tel:+22670271810" className="flex min-h-10 items-center gap-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              +226 70 27 18 10
            </a>
            <p className="flex min-h-10 items-center gap-3 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Ouagadougou, Burkina Faso
            </p>
          </address>
        </div>

        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-4 text-sm font-extrabold text-foreground">{section.title}</h2>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("#") ? (
                    <a href={link.href} className="inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.href} className="inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            © {new Date().getFullYear()} KORA. {t("landing.footerMadeWith")}
            <Heart className="h-3.5 w-3.5 fill-current text-red-500" aria-hidden="true" />
            {t("landing.footerInAfrica")}
          </p>
          <p className="text-sm text-muted-foreground">{t("landing.footerRights")}</p>
        </div>
      </div>
    </footer>
  )
}
