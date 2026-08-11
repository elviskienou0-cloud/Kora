import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Search,
  Heart,
  Send,
  Star,
  MapPin,
  Briefcase,
  Filter,
  X,
  ChevronDown,
  Sparkles,
  Users,
  CheckCircle2,
  Eye,
  Megaphone,
  BarChart3,
  FileText,
} from "lucide-react";

const categories = [
  { id: "all", label: "Toutes", icon: Users },
  { id: "dev", label: "Développement", icon: Briefcase },
  { id: "design", label: "Design", icon: Sparkles },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "data", label: "Data", icon: BarChart3 },
  { id: "content", label: "Contenu", icon: FileText },
];

const countries = [
  "Tous les pays",
  "Sénégal",
  "Côte d'Ivoire",
  "Nigéria",
  "Ghana",
  "Mali",
  "Burkina Faso",
  "Kenya",
  "Afrique du Sud",
  "Maroc",
  "Tunisie",
];

const talents = [
  {
    id: 1,
    firstName: "Aïcha",
    lastName: "Diallo",
    category: "design",
    country: "Sénégal",
    city: "Dakar",
    rating: 4.9,
    reviews: 142,
    completedProjects: 38,
    rate: 50000,
    title: "UI/UX Designer Senior",
    bio: "Designer passionnée avec 7 ans d'expérience dans la création d'interfaces élégantes et centrées utilisateur.",
    skills: ["Figma", "Adobe XD", "Prototypage", "Recherche UX", "Systèmes de design"],
    verified: true,
    available: true,
    addedAt: "2026-01-15",
  },
  {
    id: 2,
    firstName: "Kwame",
    lastName: "Asante",
    category: "dev",
    country: "Ghana",
    city: "Accra",
    rating: 4.8,
    reviews: 98,
    completedProjects: 56,
    rate: 75000,
    title: "Développeur Full Stack",
    bio: "Expert React, Node.js et cloud. J'accompagne les startups dans leurs développements web et mobiles.",
    skills: ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL"],
    verified: true,
    available: true,
    addedAt: "2026-02-20",
  },
  {
    id: 3,
    firstName: "Fatou",
    lastName: "Ndiaye",
    category: "marketing",
    country: "Côte d'Ivoire",
    city: "Abidjan",
    rating: 4.7,
    reviews: 87,
    completedProjects: 42,
    rate: 45000,
    title: "Strategist Marketing Digital",
    bio: "Spécialiste en stratégie digitale et growth hacking. J'aide les marques à se développer en Afrique.",
    skills: ["SEO", "Google Ads", "Social Media", "Analytics", "Content Strategy"],
    verified: true,
    available: false,
    addedAt: "2026-03-10",
  },
  {
    id: 4,
    firstName: "Chinedu",
    lastName: "Okafor",
    category: "data",
    country: "Nigéria",
    city: "Lagos",
    rating: 4.9,
    reviews: 156,
    completedProjects: 67,
    rate: 90000,
    title: "Data Scientist Senior",
    bio: "PhD en Data Science, expert en Machine Learning et modélisation prédictive pour la finance et le retail.",
    skills: ["Python", "TensorFlow", "SQL", "Power BI", "Statistiques"],
    verified: true,
    available: true,
    addedAt: "2026-01-05",
  },
  {
    id: 5,
    firstName: "Zara",
    lastName: "Abubakar",
    category: "design",
    country: "Nigéria",
    city: "Abuja",
    rating: 4.8,
    reviews: 127,
    completedProjects: 31,
    rate: 55000,
    title: "Product Designer",
    bio: "Je conçois des expériences numériques mémorables pour des startups africaines et internationales.",
    skills: ["Figma", "Design System", "User Testing", "Wireframing"],
    verified: true,
    available: true,
    addedAt: "2026-04-01",
  },
  {
    id: 6,
    firstName: "Thierno",
    lastName: "Sow",
    category: "dev",
    country: "Sénégal",
    city: "Thiès",
    rating: 4.7,
    reviews: 89,
    completedProjects: 44,
    rate: 65000,
    title: "Développeur Mobile Flutter",
    bio: "4 ans d'expérience en développement mobile cross-platform avec Flutter et React Native.",
    skills: ["Flutter", "Dart", "React Native", "Firebase", "iOS/Android"],
    verified: false,
    available: true,
    addedAt: "2026-03-22",
  },
  {
    id: 7,
    firstName: "Amina",
    lastName: "Kone",
    category: "content",
    country: "Mali",
    city: "Bamako",
    rating: 4.7,
    reviews: 156,
    completedProjects: 89,
    rate: 35000,
    title: "Rédactrice & Storyteller",
    bio: "Je raconte des histoires qui font vibrer. Contenus web, copywriting et brand storytelling.",
    skills: ["Copywriting", "SEO Writing", "Brand Content", "Storytelling"],
    verified: true,
    available: true,
    addedAt: "2026-02-14",
  },
  {
    id: 8,
    firstName: "Boubacar",
    lastName: "Traoré",
    category: "dev",
    country: "Burkina Faso",
    city: "Ouagadougou",
    rating: 4.6,
    reviews: 52,
    completedProjects: 28,
    rate: 55000,
    title: "Développeur Backend PHP/Symfony",
    bio: "Architecte backend spécialisé Symfony, Laravel et APIs REST sécurisées et performantes.",
    skills: ["Symfony", "Laravel", "PHP", "MySQL", "Docker"],
    verified: true,
    available: false,
    addedAt: "2026-05-10",
  },
  {
    id: 9,
    firstName: "Nairobi",
    lastName: "Kamau",
    category: "marketing",
    country: "Kenya",
    city: "Nairobi",
    rating: 4.8,
    reviews: 112,
    completedProjects: 63,
    rate: 50000,
    title: "Community Manager & Brand Strategist",
    bio: "Je construis des communautés engagées autour de marques qui ont de l'impact en Afrique de l'Est.",
    skills: ["Community Mgmt", "Brand Strategy", "Influencer", "TikTok/IG"],
    verified: true,
    available: true,
    addedAt: "2026-01-30",
  },
  {
    id: 10,
    firstName: "Siphiwe",
    lastName: "Dlamini",
    category: "data",
    country: "Afrique du Sud",
    city: "Johannesburg",
    rating: 4.9,
    reviews: 78,
    completedProjects: 34,
    rate: 85000,
    title: "Data Engineer",
    bio: "Je construis des pipelines de données robustes et des entrepôts de données scalables pour les entreprises.",
    skills: ["Spark", "Airflow", "Snowflake", "dbt", "Python"],
    verified: true,
    available: true,
    addedAt: "2026-03-05",
  },
  {
    id: 11,
    firstName: "Youssef",
    lastName: "El Amrani",
    category: "design",
    country: "Maroc",
    city: "Casablanca",
    rating: 4.7,
    reviews: 94,
    completedProjects: 51,
    rate: 60000,
    title: "Motion Designer & Illustrateur",
    bio: "Animation 2D/3D, motion design et illustration pour campagnes digitales et brand content.",
    skills: ["After Effects", "Cinema 4D", "Illustrator", "Premiere Pro"],
    verified: true,
    available: true,
    addedAt: "2026-02-28",
  },
  {
    id: 12,
    firstName: "Eya",
    lastName: "Ben Salah",
    category: "dev",
    country: "Tunisie",
    city: "Tunis",
    rating: 4.8,
    reviews: 67,
    completedProjects: 39,
    rate: 60000,
    title: "Développeuse Frontend Vue.js",
    bio: "Spécialisée en interfaces riches et interactives avec Vue.js, Nuxt et animations performantes.",
    skills: ["Vue.js", "Nuxt", "TypeScript", "Tailwind", "GSAP"],
    verified: false,
    available: true,
    addedAt: "2026-04-18",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function ClientBrowse() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("Tous les pays");
  const [minRate, setMinRate] = useState(0);
  const [maxRate, setMaxRate] = useState(150000);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(new Set([1, 5]));
  const [sortBy, setSortBy] = useState("recommended");

  const filteredTalents = useMemo(() => {
    let result = [...talents];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.firstName.toLowerCase().includes(q) ||
          t.lastName.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (selectedCountry !== "Tous les pays") {
      result = result.filter((t) => t.country === selectedCountry);
    }

    result = result.filter((t) => t.rate >= minRate && t.rate <= maxRate);

    if (availableOnly) result = result.filter((t) => t.available);
    if (verifiedOnly) result = result.filter((t) => t.verified);

    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "projects":
        result.sort((a, b) => b.completedProjects - a.completedProjects);
        break;
      case "rate-asc":
        result.sort((a, b) => a.rate - b.rate);
        break;
      case "rate-desc":
        result.sort((a, b) => b.rate - a.rate);
        break;
      default:
        result.sort((a, b) => b.reviews * b.rating - a.reviews * a.rating);
    }

    return result;
  }, [search, selectedCategory, selectedCountry, minRate, maxRate, availableOnly, verifiedOnly, sortBy]);

  const toggleFavorite = (id) => {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
  };

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedCountry !== "Tous les pays" ? 1 : 0) +
    (minRate > 0 ? 1 : 0) +
    (maxRate < 150000 ? 1 : 0) +
    (availableOnly ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedCountry("Tous les pays");
    setMinRate(0);
    setMaxRate(150000);
    setAvailableOnly(false);
    setVerifiedOnly(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/40 via-background to-background p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div variants={itemVariants}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Découvrez nos <span className="gold-text-gradient">Talents</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {talents.length} professionnels vérifiés à travers toute l'Afrique
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un talent, une compétence, un métier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 pr-4 border-gold/30 focus:border-gold focus:ring-gold/30 bg-card text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 rounded-xl border border-gold/30 bg-card px-4 pr-9 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="recommended">Recommandés</option>
                <option value="rating">Mieux notés</option>
                <option value="projects">Plus d'expérience</option>
                <option value="rate-asc">Prix croissant</option>
                <option value="rate-desc">Prix décroissant</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "h-12 gap-2 border-gold/30",
                  showFilters || activeFiltersCount > 0 ? "bg-gold/10 border-gold text-gold-dark" : ""
                )}
              >
                <Filter className="h-4 w-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className={cn(
                    "h-10 gap-2 rounded-xl border px-4 transition-all data-[state=active]:shadow-md",
                    selectedCategory === cat.id
                      ? "gold-gradient text-primary-foreground border-transparent shadow-gold/30"
                      : "border-gold/20 bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
                  )}
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <Card className="border-gold/20 shadow-sm">
                  <CardContent className="grid gap-5 p-5 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gold-dark" />
                        Pays
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                      >
                        {countries.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-foreground">
                        Fourchette de tarif (XOF/jour)
                      </label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={minRate}
                          onChange={(e) => setMinRate(Number(e.target.value))}
                          className="h-11"
                          min={0}
                          max={150000}
                        />
                        <span className="text-muted-foreground">—</span>
                        <Input
                          type="number"
                          value={maxRate}
                          onChange={(e) => setMaxRate(Number(e.target.value))}
                          className="h-11"
                          min={0}
                          max={500000}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={150000}
                        step={5000}
                        value={maxRate}
                        onChange={(e) => setMaxRate(Number(e.target.value))}
                        className="w-full accent-gold"
                      />
                    </div>
                    <div className="md:col-span-3 flex flex-wrap items-center gap-3 md:justify-between">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={availableOnly}
                            onChange={(e) => setAvailableOnly(e.target.checked)}
                            className="h-4 w-4 rounded accent-gold"
                          />
                          Disponibles uniquement
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={verifiedOnly}
                            onChange={(e) => setVerifiedOnly(e.target.checked)}
                            className="h-4 w-4 rounded accent-gold"
                          />
                          Vérifiés uniquement
                        </label>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={resetFilters}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Réinitialiser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredTalents.length}</span> talent{filteredTalents.length > 1 ? "s" : ""} trouvés
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filteredTalents.length === 0 ? (
            <motion.div variants={itemVariants} className="col-span-full">
              <Card className="border-dashed border-gold/30 bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold">Aucun talent trouvé</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    Modifiez vos critères de recherche ou de filtrage pour découvrir d'autres professionnels.
                  </p>
                  <Button onClick={resetFilters} variant="outline" className="mt-5 border-gold/50 text-gold-dark hover:bg-gold/10">
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredTalents.map((t) => (
              <motion.div key={t.id} variants={itemVariants} layout>
                <Card className="group h-full border-gold/15 transition-all duration-300 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 hover:-translate-y-0.5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-14 w-14 ring-2 ring-gold/30 ring-offset-2 ring-offset-card">
                          <AvatarFallback className="gold-gradient text-white font-bold text-lg">
                            {t.firstName[0]}{t.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold truncate">{t.firstName} {t.lastName}</h3>
                            {t.verified && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 fill-emerald-50" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-gold-dark truncate">{t.title}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {t.city}, {t.country}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(t.id)}
                        className="shrink-0 rounded-full p-2 transition-all hover:bg-rose-50 active:scale-90"
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5 transition-all",
                            favorites.has(t.id)
                              ? "fill-rose-500 text-rose-500"
                              : "text-muted-foreground group-hover:text-rose-400"
                          )}
                        />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{t.bio}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {t.skills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="outline" className="border-gold/25 bg-gold/5 text-gold-dark text-xs font-medium">
                          {s}
                        </Badge>
                      ))}
                      {t.skills.length > 4 && (
                        <Badge variant="outline" className="border-muted text-muted-foreground text-xs">
                          +{t.skills.length - 4}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          <span className="font-semibold text-foreground">{t.rating}</span>
                          <span className="text-muted-foreground">({t.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5" />
                          {t.completedProjects} projets
                        </div>
                      </div>
                      {t.available ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px]">
                          Disponible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-muted text-muted-foreground text-[10px]">
                          Occupé
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Tarif journalier</p>
                      <p className="text-lg font-bold gold-text-gradient">{formatCurrency(t.rate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-gold-dark hover:bg-gold/10 h-9 w-9 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 gold-gradient text-primary-foreground hover:opacity-90 shadow-sm shadow-gold/25"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Contacter
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
