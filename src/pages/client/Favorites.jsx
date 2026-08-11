import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Heart,
  Search,
  Star,
  MapPin,
  Briefcase,
  Send,
  Eye,
  HeartCrack,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react";

const favoriteTalents = [
  {
    id: 1,
    firstName: "Aïcha",
    lastName: "Diallo",
    category: "Design UI/UX",
    country: "Sénégal",
    city: "Dakar",
    rating: 4.9,
    reviews: 142,
    completedProjects: 38,
    rate: 50000,
    title: "UI/UX Designer Senior",
    skills: ["Figma", "Adobe XD", "Prototypage"],
    verified: true,
    available: true,
    savedAt: "Il y a 2 jours",
  },
  {
    id: 5,
    firstName: "Zara",
    lastName: "Abubakar",
    category: "Design",
    country: "Nigéria",
    city: "Abuja",
    rating: 4.8,
    reviews: 127,
    completedProjects: 31,
    rate: 55000,
    title: "Product Designer",
    skills: ["Figma", "Design System", "User Testing"],
    verified: true,
    available: true,
    savedAt: "Il y a 5 jours",
  },
  {
    id: 4,
    firstName: "Chinedu",
    lastName: "Okafor",
    category: "Data Science",
    country: "Nigéria",
    city: "Lagos",
    rating: 4.9,
    reviews: 156,
    completedProjects: 67,
    rate: 90000,
    title: "Data Scientist Senior",
    skills: ["Python", "TensorFlow", "SQL"],
    verified: true,
    available: true,
    savedAt: "Il y a 1 semaine",
  },
  {
    id: 7,
    firstName: "Amina",
    lastName: "Kone",
    category: "Contenu",
    country: "Mali",
    city: "Bamako",
    rating: 4.7,
    reviews: 156,
    completedProjects: 89,
    rate: 35000,
    title: "Rédactrice & Storyteller",
    skills: ["Copywriting", "SEO Writing", "Brand Content"],
    verified: true,
    available: true,
    savedAt: "Il y a 2 semaines",
  },
  {
    id: 11,
    firstName: "Youssef",
    lastName: "El Amrani",
    category: "Motion Design",
    country: "Maroc",
    city: "Casablanca",
    rating: 4.7,
    reviews: 94,
    completedProjects: 51,
    rate: 60000,
    title: "Motion Designer & Illustrateur",
    skills: ["After Effects", "Cinema 4D", "Illustrator"],
    verified: true,
    available: false,
    savedAt: "Il y a 3 semaines",
  },
];

const categories = [
  { id: "all", label: "Tous" },
  { id: "design", label: "Design" },
  { id: "dev", label: "Développement" },
  { id: "data", label: "Data" },
  { id: "marketing", label: "Marketing" },
  { id: "content", label: "Contenu" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function ClientFavorites() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState(favoriteTalents);

  const filtered = favorites.filter((t) => {
    const matchSearch =
      !search ||
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const removeFavorite = (id) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const isEmpty = favorites.length === 0;

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
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gold-gradient shadow-lg shadow-gold/25">
                <Heart className="h-6 w-6 fill-white text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Mes <span className="gold-text-gradient">Favoris</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {favorites.length} talent{favorites.length > 1 ? "s" : ""} sauvegardé{favorites.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {!isEmpty && (
              <div className="relative max-w-md flex-1 md:max-w-sm">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans vos favoris..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 pl-11 pr-4 border-gold/30 focus:border-gold focus:ring-gold/30"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {!isEmpty && (
            <div className="mt-5">
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
                  {categories.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className={cn(
                        "h-9 rounded-xl border px-4 text-sm",
                        activeCategory === cat.id
                          ? "gold-gradient text-primary-foreground border-transparent shadow-md shadow-gold/25"
                          : "border-gold/20 bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
                      )}
                    >
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-dashed border-gold/30 bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-6"
                  >
                    <div className="relative">
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gold/10 text-gold-dark">
                        <HeartCrack className="h-12 w-12" />
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 12, -12, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full gold-gradient shadow-md shadow-gold/40"
                      >
                        <Sparkles className="h-4 w-4 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>
                  <h2 className="text-xl font-bold text-foreground">Aucun favori pour le moment</h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Sauvegardez les talents qui vous intéressent pour les retrouver facilement et comparer leurs profils.
                  </p>
                  <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                    <Button className="gold-gradient text-primary-foreground hover:opacity-90 shadow-md shadow-gold/30">
                      Découvrir des talents
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="border-gold/40 text-gold-dark hover:bg-gold/10">
                      Comment ça marche ?
                    </Button>
                  </div>
                  <Separator className="my-10 max-w-xs" />
                  <div className="grid gap-4 text-left sm:grid-cols-3">
                    {[
                      { icon: Heart, title: "Cliquez sur", desc: "l'icône cœur sur un profil" },
                      { icon: Eye, title: "Retrouvez-les", desc: "ici, à tout moment" },
                      { icon: Send, title: "Envoyez des", desc: "demandes en un clic" },
                    ].map((f, i) => (
                      <div key={i} className="flex gap-3 rounded-xl border border-gold/15 bg-card p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
                          <f.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{f.title}</p>
                          <p className="text-xs text-muted-foreground">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-dashed border-gold/20">
                <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark">
                    <Search className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold">Aucun résultat</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aucun de vos favoris ne correspond à "{search}"
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setSearch("")}
                    className="mt-4 text-sm text-gold-dark hover:bg-gold/10"
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Effacer la recherche
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {filtered.map((t) => (
                <motion.div key={t.id} variants={itemVariants} layout>
                  <Card className="group h-full border-gold/15 transition-all duration-300 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-xl bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold text-rose-500">
                      <Heart className="h-3 w-3 fill-rose-500" /> {t.savedAt}
                    </div>
                    <CardHeader className="pb-3 pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-14 w-14 ring-2 ring-gold/30 ring-offset-2 ring-offset-card">
                            <AvatarFallback className="gold-gradient text-white font-bold text-lg">
                              {t.firstName[0]}{t.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 pr-2">
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
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-4">
                      <div className="flex flex-wrap gap-1.5">
                        {t.skills.map((s) => (
                          <Badge key={s} variant="outline" className="border-gold/25 bg-gold/5 text-gold-dark text-xs font-medium">
                            {s}
                          </Badge>
                        ))}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFavorite(t.id)}
                          className="text-rose-500 hover:bg-rose-500/10 h-9 w-9 p-0"
                          title="Retirer des favoris"
                        >
                          <HeartCrack className="h-4 w-4" />
                        </Button>
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
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
