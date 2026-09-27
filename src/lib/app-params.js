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
    "Cameroun",
    "Rwanda",
  ],
  categories: [
    { id: "music", name: "Musique & Spectacle", icon: "music" },
    { id: "fashion", name: "Mode & Mannequinat", icon: "shirt" },
    { id: "influence", name: "Contenu & Influence", icon: "smartphone" },
    { id: "sport", name: "Sport", icon: "trophy" },
    { id: "events", name: "Événementiel", icon: "party" },
    { id: "culture", name: "Culture & Traditions", icon: "drum" },
    { id: "cinema", name: "Cinéma & Audiovisuel", icon: "clapperboard" },
    { id: "voice", name: "Voix & Doublage", icon: "mic" },
    { id: "comedy", name: "Humour & Animation", icon: "laugh" },
    { id: "beauty", name: "Beauté & Image", icon: "sparkles" },
    { id: "gastronomy", name: "Gastronomie & Traiteur", icon: "utensils" },
  ],
  plans: {
    free: { name: "Découverte", price: 0, period: "/mois" },
    pro: { name: "Talent Pro", price: 2500, period: "/mois" },
    business: { name: "Business", price: 7500, period: "/mois" },
    enterprise: { name: "Entreprise", price: null, period: "" },
  },
}

export default APP_PARAMS