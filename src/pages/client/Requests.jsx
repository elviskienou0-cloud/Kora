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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Eye,
  MessageSquare,
  Download,
  Filter,
  X,
  FileText,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { generatePDFReport } from "@/utils/pdfReport";

const requests = [
  {
    id: "REQ-2026-089",
    talent: { firstName: "Aïcha", lastName: "Diallo", initials: "AD", category: "Design UI/UX" },
    client: "SunuBank SA",
    status: "en_attente",
    title: "Refonte de l'application mobile",
    description: "Refonte complète de l'interface utilisateur de notre application mobile banking.",
    startDate: "2026-08-15",
    endDate: "2026-10-15",
    duration: "2 mois",
    budget: 3500000,
    createdAt: "2026-08-05",
    priority: "haute",
  },
  {
    id: "REQ-2026-085",
    talent: { firstName: "Kwame", lastName: "Asante", initials: "KA", category: "Développement Web" },
    client: "AfrikaTech",
    status: "acceptee",
    title: "Développement plateforme SaaS",
    description: "Construction d'une plateforme de gestion de projets pour startups africaines.",
    startDate: "2026-08-10",
    endDate: "2026-12-10",
    duration: "4 mois",
    budget: 12500000,
    createdAt: "2026-08-02",
    priority: "haute",
  },
  {
    id: "REQ-2026-078",
    talent: { firstName: "Fatou", lastName: "Ndiaye", initials: "FN", category: "Marketing Digital" },
    client: "SunuBank SA",
    status: "en_cours",
    title: "Campagne de lancement produit",
    description: "Stratégie digitale complète pour le lancement de notre nouvelle carte bancaire.",
    startDate: "2026-07-25",
    endDate: "2026-08-25",
    duration: "1 mois",
    budget: 1800000,
    createdAt: "2026-07-20",
    priority: "moyenne",
  },
  {
    id: "REQ-2026-072",
    talent: { firstName: "Chinedu", lastName: "Okafor", initials: "CO", category: "Data Science" },
    client: "MarketPalace",
    status: "en_cours",
    title: "Modèle prédictif churn",
    description: "Développement d'un modèle de machine learning pour prédire le churn client.",
    startDate: "2026-07-01",
    endDate: "2026-09-01",
    duration: "2 mois",
    budget: 5600000,
    createdAt: "2026-06-20",
    priority: "haute",
  },
  {
    id: "REQ-2026-065",
    talent: { firstName: "Amina", lastName: "Kone", initials: "AK", category: "Contenu" },
    client: "Joliba Store",
    status: "terminee",
    title: "Refonte site e-commerce",
    description: "Rédaction de toutes les fiches produits et pages marketing du nouveau site.",
    startDate: "2026-06-01",
    endDate: "2026-07-15",
    duration: "6 semaines",
    budget: 950000,
    createdAt: "2026-05-25",
    priority: "basse",
  },
  {
    id: "REQ-2026-060",
    talent: { firstName: "Thierno", lastName: "Sow", initials: "TS", category: "Développement Mobile" },
    client: "AfrikaTech",
    status: "terminee",
    title: "Application livraison repas",
    description: "Application Flutter cross-platform iOS/Android pour un service de livraison.",
    startDate: "2026-04-15",
    endDate: "2026-06-30",
    duration: "2.5 mois",
    budget: 8200000,
    createdAt: "2026-04-05",
    priority: "haute",
  },
  {
    id: "REQ-2026-055",
    talent: { firstName: "Nairobi", lastName: "Kamau", initials: "NK", category: "Marketing" },
    client: "Joliba Store",
    status: "refusee",
    title: "Gestion réseaux sociaux",
    description: "Community management mensuel pour les comptes Instagram et TikTok.",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    duration: "1 mois",
    budget: 600000,
    createdAt: "2026-05-10",
    priority: "basse",
  },
];

const statusConfig = {
  en_attente: {
    label: "En attente",
    className: "border-gold text-gold-dark bg-gold/10",
    icon: Clock,
  },
  acceptee: {
    label: "Acceptée",
    className: "bg-emerald-500 text-white hover:bg-emerald-600",
    icon: CheckCircle2,
  },
  en_cours: {
    label: "En cours",
    className: "bg-blue-500 text-white hover:bg-blue-600",
    icon: Loader2,
  },
  terminee: {
    label: "Terminée",
    className: "bg-slate-700 text-white hover:bg-slate-800",
    icon: CheckCircle2,
  },
  refusee: {
    label: "Refusée",
    className: "bg-red-500 text-white hover:bg-red-600",
    icon: XCircle,
  },
};

const priorityConfig = {
  haute: { label: "Haute", className: "bg-red-500/10 text-red-600 border-red-500/30" },
  moyenne: { label: "Moyenne", className: "bg-gold/10 text-gold-dark border-gold/30" },
  basse: { label: "Basse", className: "bg-slate-500/10 text-slate-600 border-slate-500/30" },
};

const statsByStatus = (tab) => {
  const base = requests.filter((r) => (tab === "all" ? true : r.status === tab));
  return base.length;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function ClientRequests() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table");

  const filtered = requests.filter((r) => {
    const matchTab = activeTab === "all" || r.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      r.id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      `${r.talent.firstName} ${r.talent.lastName}`.toLowerCase().includes(q) ||
      r.talent.category.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const statsCards = [
    { key: "all", label: "Toutes", count: requests.length, icon: FileText, color: "gold" },
    { key: "en_attente", label: "En attente", count: statsByStatus("en_attente"), icon: Clock, color: "amber" },
    { key: "acceptee", label: "Acceptées", count: statsByStatus("acceptee"), icon: CheckCircle2, color: "emerald" },
    { key: "en_cours", label: "En cours", count: statsByStatus("en_cours"), icon: Loader2, color: "blue" },
    { key: "terminee", label: "Terminées", count: statsByStatus("terminee"), icon: CheckCircle2, color: "slate" },
    { key: "refusee", label: "Refusées", count: statsByStatus("refusee"), icon: XCircle, color: "red" },
  ];

  const totalBudget = requests
    .filter((r) => r.status === "terminee" || r.status === "en_cours")
    .reduce((sum, r) => sum + r.budget, 0);

  const handleExport = async () => {
    await generatePDFReport("requests-report-section", {
      filename: "mes-demandes-kora.pdf",
      title: "Mes Demandes de Collaboration",
      subtitle: "Historique complet des demandes envoyées",
    });
  };

  return (
    <div id="requests-report-section" className="min-h-screen bg-gradient-to-br from-accent/40 via-background to-background p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div variants={itemVariants}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gold-gradient shadow-lg shadow-gold/25">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Mes <span className="gold-text-gradient">Demandes</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {requests.length} demandes envoyées · {formatCurrency(totalBudget)} engagés
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExport}
                className="border-gold/40 text-gold-dark hover:bg-gold/10"
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
              <Button className="gold-gradient text-primary-foreground hover:opacity-90 shadow-md shadow-gold/30">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle demande
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {statsCards.map((s) => {
            const active = activeTab === s.key;
            const colorMap = {
              gold: { bg: "bg-gold/15", text: "text-gold-dark", border: "border-gold/40" },
              amber: { bg: "bg-amber-500/15", text: "text-amber-600", border: "border-amber-500/40" },
              emerald: { bg: "bg-emerald-500/15", text: "text-emerald-600", border: "border-emerald-500/40" },
              blue: { bg: "bg-blue-500/15", text: "text-blue-600", border: "border-blue-500/40" },
              slate: { bg: "bg-slate-500/15", text: "text-slate-600", border: "border-slate-500/40" },
              red: { bg: "bg-red-500/15", text: "text-red-600", border: "border-red-500/40" },
            };
            const c = colorMap[s.color];
            return (
              <button
                key={s.key}
                onClick={() => setActiveTab(s.key)}
                className={cn(
                  "text-left rounded-2xl p-4 border transition-all",
                  active
                    ? "gold-gradient text-primary-foreground border-transparent shadow-lg shadow-gold/25"
                    : cn(c.bg, c.border, "hover:shadow-md border border-card")
                )}
              >
                <div className="flex items-center justify-between">
                  <p className={cn("text-sm font-medium", active ? "text-primary-foreground/90" : "text-muted-foreground")}>
                    {s.label}
                  </p>
                  <s.icon className={cn("h-4 w-4", active ? "text-primary-foreground" : c.text)} />
                </div>
                <p className={cn("mt-2 text-2xl font-bold", active ? "text-primary-foreground" : "text-foreground")}>
                  {s.count}
                </p>
              </button>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <Card className="border-gold/20 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-xl flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une demande (ID, titre, talent, catégorie...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 pl-11 pr-10 border-gold/30 focus:border-gold focus:ring-gold/30"
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
                <div className="flex items-center gap-2">
                  <Tabs value={view} onValueChange={setView}>
                    <TabsList className="h-11 rounded-xl border border-gold/30 bg-background p-1">
                      <TabsTrigger value="table" className="h-9 rounded-lg data-[state=active]:gold-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                        <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                        Tableau
                      </TabsTrigger>
                      <TabsTrigger value="cards" className="h-9 rounded-lg data-[state=active]:gold-gradient data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                        <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Cartes
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold">Aucune demande</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Aucune demande ne correspond à votre recherche ou à ce filtre.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => { setActiveTab("all"); setSearch(""); }}
                    className="mt-4 text-gold-dark hover:bg-gold/10"
                  >
                    Réinitialiser
                  </Button>
                </div>
              ) : view === "table" ? (
                <div className="overflow-hidden rounded-xl border border-gold/15">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gold/5 hover:bg-gold/5 border-b-gold/15">
                        <TableHead className="font-semibold text-foreground">Demande</TableHead>
                        <TableHead className="font-semibold text-foreground">Talent</TableHead>
                        <TableHead className="font-semibold text-foreground">Budget</TableHead>
                        <TableHead className="font-semibold text-foreground">Dates</TableHead>
                        <TableHead className="font-semibold text-foreground">Priorité</TableHead>
                        <TableHead className="font-semibold text-foreground">Statut</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => {
                        const sc = statusConfig[r.status];
                        const pc = priorityConfig[r.priority];
                        return (
                          <TableRow key={r.id} className="border-b-gold/10 hover:bg-gold/[0.03] transition-colors">
                            <TableCell>
                              <div className="min-w-0 max-w-[260px]">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-mono text-gold-dark">{r.id}</p>
                                </div>
                                <p className="font-semibold truncate">{r.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{r.client}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 ring-2 ring-gold/20 ring-offset-2 ring-offset-card">
                                  <AvatarFallback className="gold-gradient text-white text-xs font-bold">
                                    {r.talent.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">
                                    {r.talent.firstName} {r.talent.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{r.talent.category}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-bold text-foreground">{formatCurrency(r.budget)}</p>
                              <p className="text-xs text-muted-foreground">{r.duration}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{formatDate(r.startDate)}</p>
                              <p className="text-xs text-muted-foreground">→ {formatDate(r.endDate)}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs font-medium border", pc.className)}>
                                {pc.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("gap-1 text-xs", sc.className)}>
                                <sc.icon className="h-3 w-3" />
                                {sc.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1.5">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gold-dark hover:bg-gold/10">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gold-dark hover:bg-gold/10">
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                {(r.status === "terminee" || r.status === "en_cours") && (
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gold-dark hover:bg-gold/10">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((r) => {
                    const sc = statusConfig[r.status];
                    const pc = priorityConfig[r.priority];
                    return (
                      <Card key={r.id} className="group h-full border-gold/15 transition-all hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-mono text-xs text-gold-dark">{r.id}</p>
                              <h3 className="mt-0.5 font-bold leading-tight">{r.title}</h3>
                            </div>
                            <Badge className={cn("gap-1 text-[10px]", sc.className)}>
                              <sc.icon className="h-3 w-3" />
                              {sc.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-3">
                          <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                          <Separator />
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-gold/20 ring-offset-2 ring-offset-card">
                              <AvatarFallback className="gold-gradient text-white text-xs font-bold">
                                {r.talent.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate">
                                {r.talent.firstName} {r.talent.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{r.talent.category}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Budget</p>
                              <p className="font-bold gold-text-gradient">{formatCurrency(r.budget)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Durée</p>
                              <p className="font-semibold text-foreground">{r.duration}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Début</p>
                              <p className="font-semibold text-foreground">{formatDate(r.startDate).substring(0, 12)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Priorité</p>
                              <Badge variant="outline" className={cn("text-[10px] mt-1 border", pc.className)}>
                                {pc.label}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                        <Separator />
                        <CardFooter className="flex items-center justify-between py-3">
                          <p className="text-[11px] text-muted-foreground">Crée le {formatDate(r.createdAt)}</p>
                          <Button size="sm" variant="ghost" className="text-gold-dark hover:bg-gold/10 h-8 px-3">
                            Détails
                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
