export const APP_PARAMS = {
  name: "KORA",
  tagline: "La plateforme des talents africains",
  description:
    "KORA connecte les talents africains exceptionnels avec les opportunités qui les méritent, en Afrique et au-delà.",
  supportEmail: "support@kora.africa",
  contactEmail: "hello@kora.africa",
  socials: {
    twitter: "https://twitter.com/kora_africa",
    linkedin: "https://linkedin.com/company/kora-africa",
    instagram: "https://instagram.com/kora.africa",
  },
  countries: [
    "Côte d'Ivoire",
    "Afrique du Sud",
    "Nigéria",
    "Kenya",
    "Ghana",
    "Maroc",
    "Égypte",
    "Sénégal",
    "Éthiopie",
    "Tanzanie",
    " Cameroun",
    "Rwanda",
  ],
  categories: [
    { id: "tech", name: "Technologie & Digital", icon: "cpu", count: 1248 },
    { id: "creative", name: "Créatif & Design", icon: "palette", count: 872 },
    { id: "business", name: "Business & Stratégie", icon: "briefcase", count: 534 },
    { id: "marketing", name: "Marketing & Communication", icon: "megaphone", count: 612 },
    { id: "finance", name: "Finance & Comptabilité", icon: "landmark", count: 298 },
    { id: "legal", name: "Juridique & Conseil", icon: "scale", count: 156 },
    { id: "education", name: "Formation & Éducation", icon: "graduation", count: 421 },
    { id: "health", name: "Santé & Bien-être", icon: "heart", count: 267 },
  ],
  plans: {
    free: { name: "Découverte", price: 0, period: "/mois" },
    pro: { name: "Talent Pro", price: 2500, period: "/mois" },
    business: { name: "Business", price: 7500, period: "/mois" },
    enterprise: { name: "Entreprise", price: null, period: "" },
  },
}

export default APP_PARAMS
