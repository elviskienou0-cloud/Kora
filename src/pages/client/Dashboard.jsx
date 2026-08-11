import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  Clock,
  Heart,
  Send,
  Star,
  ChevronRight,
  Search,
  Sparkles,
  Users,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const monthlyActivity = [
  { month: "Jan", demandes: 3, recherches: 12 },
  { month: "Fév", demandes: 5, recherches: 18 },
  { month: "Mar", demandes: 4, recherches: 22 },
  { month: "Avr", demandes: 8, recherches: 28 },
  { month: "Mai", demandes: 6, recherches: 35 },
  { month: "Juin", demandes: 9, recherches: 41 },
  { month: "Juil", demandes: 12, recherches: 48 },
];

const recentRequests = [
  {
    id: "REQ-001",
    talent: { name: "Aïcha Diallo", category: "Design UI/UX", country: "Sénégal" },
    status: "en_attente",
    date: "2026-08-05",
    budget: 350000,
  },
  {
    id: "REQ-002",
    talent: { name: "Kwame Asante", category: "Développement Web", country: "Ghana" },
    status: "acceptee",
    date: "2026-08-02",
    budget: 750000,
  },
  {
    id: "REQ-003",
    talent: { name: "Fatou Ndiaye", category: "Marketing Digital", country: "Côte d'Ivoire" },
    status: "terminee",
    date: "2026-07-28",
    budget: 200000,
  },
  {
    id: "REQ-004",
    talent: { name: "Chinedu Okafor", category: "Data Science", country: "Nigeria" },
    status: "refusee",
    date: "2026-07-20",
    budget: 1200000,
  },
];

const recommendedTalents = [
  {
    id: 1,
    name: "Zara Abubakar",
    category: "Design UI/UX",
    country: "Nigéria",
    rating: 4.9,
    reviews: 127,
    rate: "50 000 XOF/jour",
  },
  {
    id: 2,
    name: "Thierno Sow",
    category: "Développement Mobile",
    country: "Sénégal",
    rating: 4.8,
    reviews: 89,
    rate: "65 000 XOF/jour",
  },
  {
    id: 3,
    name: "Amina Kone",
    category: "Rédaction de contenu",
    country: "Mali",
    rating: 4.7,
    reviews: 156,
    rate: "35 000 XOF/jour",
  },
];

const statusConfig = {
  en_attente: { label: "En attente", variant: "outline", className: "border-gold text-gold-dark bg-gold/10" },
  acceptee: { label: "Acceptée", variant: "default", className: "bg-emerald-500 hover:bg-emerald-600 text-white" },
  terminee: { label: "Terminée", variant: "secondary", className: "bg-slate-600 text-white" },
  refusee: { label: "Refusée", variant: "destructive", className: "bg-red-500 text-white" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("activite");

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/40 via-background to-background p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gold-gradient shadow-lg shadow-gold/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Bonjour, <span className="gold-text-gradient">Abdoulaye</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenue sur votre tableau de bord Kora
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gold/50 text-gold-dark hover:bg-gold/10 hover:border-gold"
            >
              <Search className="mr-2 h-4 w-4" />
              Rechercher
            </Button>
            <Button className="gold-gradient text-primary-foreground hover:opacity-90 shadow-md shadow-gold/30">
              <Send className="mr-2 h-4 w-4" />
              Nouvelle demande
            </Button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gold/20 hover:border-gold/40 transition-colors shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Demandes envoyées</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold tracking-tight gold-text-gradient">47</h3>
                    <span className="flex items-center text-xs font-medium text-emerald-600">
                      <ArrowUpRight className="h-3 w-3" /> +12%
                    </span>
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                  <Send className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-gold/10 overflow-hidden">
                <div className="h-full w-3/4 rounded-full gold-gradient" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20 hover:border-gold/40 transition-colors shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Demandes acceptées</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">28</h3>
                    <span className="flex items-center text-xs font-medium text-emerald-600">
                      <ArrowUpRight className="h-3 w-3" /> +8%
                    </span>
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-emerald-500/10 overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20 hover:border-gold/40 transition-colors shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Talents favoris</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">23</h3>
                    <span className="flex items-center text-xs font-medium text-emerald-600">
                      <ArrowUpRight className="h-3 w-3" /> +5
                    </span>
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
                  <Heart className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-rose-500/10 overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-rose-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20 hover:border-gold/40 transition-colors shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Budget total dépensé</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">
                      {formatCurrency(12850000)}
                    </h3>
                    <span className="flex items-center text-xs font-medium text-emerald-600">
                      <ArrowUpRight className="h-3 w-3" /> +23%
                    </span>
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-amber-500/10 overflow-hidden">
                <div className="h-full w-5/6 rounded-full bg-amber-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-gold/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-5 w-5 text-gold-dark" />
                  Activité mensuelle
                </CardTitle>
                <CardDescription>Évolution de vos demandes et recherches</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-gold/40 bg-gold/5 text-gold-dark">
                  7 derniers mois
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(42 80% 52%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(42 80% 52%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRecherches" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160 60% 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160 60% 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(25 10% 45%)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(25 10% 45%)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(42 80% 52% / 0.3)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 30px -10px hsl(42 80% 52% / 0.3)",
                      }}
                      cursor={{ stroke: "hsl(42 80% 52% / 0.3)", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="demandes"
                      stroke="hsl(42 80% 52%)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorDemandes)"
                    />
                    <Area
                      type="monotone"
                      dataKey="recherches"
                      stroke="hsl(160 60% 45%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRecherches)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gold" />
                  <span className="text-sm font-medium text-muted-foreground">Demandes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-muted-foreground">Recherches</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-gold-dark" />
                Talents recommandés
              </CardTitle>
              <CardDescription>Pour vous, basé sur vos recherches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {recommendedTalents.map((talent) => (
                <div
                  key={talent.id}
                  className="group flex items-center gap-3 rounded-xl p-2 transition-all hover:bg-gold/5 cursor-pointer"
                >
                  <Avatar className="h-11 w-11 ring-2 ring-gold/30 ring-offset-2 ring-offset-card">
                    <AvatarFallback className="bg-gold/20 text-gold-dark font-semibold">
                      {talent.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-foreground">{talent.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{talent.category} · {talent.country}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-gold text-gold" />
                        <span className="text-xs font-medium text-foreground">{talent.rating}</span>
                        <span className="text-xs text-muted-foreground">({talent.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold-dark transition-colors" />
                </div>
              ))}
              <Separator />
              <Button variant="ghost" className="w-full text-gold-dark hover:bg-gold/10">
                Voir plus de talents
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-gold/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-5 w-5 text-gold-dark" />
                  Dernières demandes
                </CardTitle>
                <CardDescription>Historique récent de vos collaborations</CardDescription>
              </div>
              <Button variant="ghost" className="text-sm text-gold-dark hover:bg-gold/10 h-8">
                Tout voir
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {recentRequests.map((req) => {
                  const cfg = statusConfig[req.status];
                  return (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 first:pt-2 last:pb-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold-dark">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{req.talent.name}</p>
                            <p className="text-xs text-muted-foreground">{req.id}</p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {req.talent.category} · {req.talent.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 ml-13 sm:ml-0">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{formatCurrency(req.budget)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(req.date)}</p>
                        </div>
                        <Badge className={cn("shrink-0", cfg.className)} variant={cfg.variant}>
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20 shadow-sm bg-gradient-to-br from-gold/5 via-card to-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gold-gradient shadow-md shadow-gold/30">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Passez au Premium</CardTitle>
                  <CardDescription>Débloquez toutes les fonctionnalités</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-foreground">Demandes illimitées</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-foreground">Support prioritaire 24/7</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-foreground">Rapports PDF avancés</span>
                </li>
              </ul>
              <Button className="w-full gold-gradient text-primary-foreground hover:opacity-90 shadow-md shadow-gold/30">
                Essayer gratuitement
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
