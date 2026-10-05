export const APP_PARAMS = {
  name: "KORA",
  tagline: "La plateforme des talents africains",
  description: "KORA connecte les talents africains exceptionnels avec les opportunités qui les méritent, en Afrique et au-delà.",
  supportEmail: "kora.contact1@gmail.com",
  contactEmail: "kora.contact1@gmail.com",
  socials: {
    twitter: "https://twitter.com/kora_africa",
    linkedin: "https://linkedin.com/company/kora-africa",
    instagram: "https://instagram.com/kora.africa",
  },
  countries: ["Côte d'Ivoire","Afrique du Sud","Nigéria","Kenya","Ghana","Maroc","Égypte","Sénégal","Éthiopie","Tanzanie","Cameroun","Rwanda"],
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
    trial: { name: "Essai", price: 0, period: "30 jours", talentLimit: 1, commissionPct: 0 },
    pro: { name: "Pro", price: 3000, period: "/mois", talentLimit: 3, commissionPct: 0 },
    business: { name: "Business", price: 0, period: "", talentLimit: null, commissionPct: 5 },
  },
}
export default APP_PARAMS
