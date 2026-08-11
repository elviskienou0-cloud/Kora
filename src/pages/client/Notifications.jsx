import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn, formatDate } from "@/lib/utils";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Check,
  Heart,
  MessageSquare,
  Briefcase,
  Star,
  AlertCircle,
  Gift,
  Sparkles,
  Search,
  X,
  Settings,
  Archive,
  MailOpen,
  ChevronRight,
  FileText,
} from "lucide-react";

const notifications = [
  {
    id: "n1",
    type: "request_accepted",
    title: "Demande acceptée !",
    message: "Aïcha Diallo a accepté votre demande de collaboration « Refonte de l'application mobile ».",
    read: false,
    createdAt: "2026-08-09T09:15:00",
    actor: { name: "Aïcha Diallo", initials: "AD" },
    link: "#",
  },
  {
    id: "n2",
    type: "new_message",
    title: "Nouveau message",
    message: "Kwame Asante vous a envoyé un message concernant la demande « Développement plateforme SaaS ».",
    read: false,
    createdAt: "2026-08-09T07:42:00",
    actor: { name: "Kwame Asante", initials: "KA" },
    link: "#",
  },
  {
    id: "n3",
    type: "new_favorite",
    title: "Nouveau dans vos favoris suggérés",
    message: "Nous avons trouvé 3 nouveaux talents correspondant à vos recherches récentes.",
    read: false,
    createdAt: "2026-08-08T18:20:00",
    actor: { name: "Kora", initials: "KO" },
    link: "#",
    system: true,
  },
  {
    id: "n4",
    type: "review",
    title: "Laissez un avis",
    message: "Comment s'est passée votre collaboration avec Amina Kone ? Votre avis aide la communauté.",
    read: true,
    createdAt: "2026-08-07T14:05:00",
    actor: { name: "Amina Kone", initials: "AK" },
    link: "#",
  },
  {
    id: "n5",
    type: "request_status",
    title: "Statut de la demande mis à jour",
    message: "Votre demande « Modèle prédictif churn » est maintenant à 75% d'avancement.",
    read: true,
    createdAt: "2026-08-06T16:30:00",
    actor: { name: "Chinedu Okafor", initials: "CO" },
    link: "#",
  },
  {
    id: "n6",
    type: "system_promo",
    title: "Offre Premium limitée",
    message: "Profitez de -30% sur l'abonnement Premium pendant 48h seulement !",
    read: true,
    createdAt: "2026-08-05T10:00:00",
    actor: { name: "Kora", initials: "KO" },
    link: "#",
    system: true,
    promo: true,
  },
  {
    id: "n7",
    type: "request_declined",
    title: "Demande refusée",
    message: "Nairobi Kamau n'est malheureusement pas disponible pour votre demande.",
    read: true,
    createdAt: "2026-08-03T11:40:00",
    actor: { name: "Nairobi Kamau", initials: "NK" },
    link: "#",
  },
  {
    id: "n8",
    type: "payment_success",
    title: "Paiement effectué",
    message: "Votre paiement de 2 050 000 XOF pour la demande « Application livraison repas » a bien été validé.",
    read: true,
    createdAt: "2026-07-28T09:20:00",
    actor: { name: "Kora", initials: "KO" },
    link: "#",
    system: true,
  },
];

const typeConfig = {
  request_accepted: {
    icon: Briefcase,
    label: "Demandes",
    dotColor: "bg-emerald-500",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600",
  },
  new_message: {
    icon: MessageSquare,
    label: "Messages",
    dotColor: "bg-blue-500",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-600",
  },
  new_favorite: {
    icon: Heart,
    label: "Favoris",
    dotColor: "bg-rose-500",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-500",
  },
  review: {
    icon: Star,
    label: "Avis",
    dotColor: "bg-gold",
    iconBg: "bg-gold/15",
    iconColor: "text-gold-dark",
  },
  request_status: {
    icon: FileText,
    label: "Statut",
    dotColor: "bg-blue-500",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-600",
  },
  system_promo: {
    icon: Gift,
    label: "Promotions",
    dotColor: "bg-purple-500",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-600",
  },
  request_declined: {
    icon: AlertCircle,
    label: "Demandes",
    dotColor: "bg-red-500",
    iconBg: "bg-red-500/15",
    iconColor: "text-red-600",
  },
  payment_success: {
    icon: CheckCheck,
    label: "Paiements",
    dotColor: "bg-emerald-500",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600",
  },
};

const filterTabs = [
  { id: "all", label: "Toutes" },
  { id: "unread", label: "Non lues" },
  { id: "requests", label: "Demandes" },
  { id: "messages", label: "Messages" },
  { id: "system", label: "Système" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, x: -8 },
  visible: { opacity: 1, y: 0, x: 0, transition: { duration: 0.3 } },
};

function formatRelative(dateISO) {
  const now = new Date();
  const d = new Date(dateISO);
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ < 7) return `Il y a ${diffJ}j`;
  return formatDate(dateISO);
}

export default function ClientNotifications() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(notifications);

  const markAllAsRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAll = () => {
    setItems([]);
  };

  const deleteOne = (id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = items.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q);

    if (filter === "unread" && n.read) return false;
    if (filter === "requests" && !["request_accepted", "request_status", "request_declined"].includes(n.type)) return false;
    if (filter === "messages" && n.type !== "new_message") return false;
    if (filter === "system" && !n.system && n.type !== "system_promo" && n.type !== "payment_success") return false;

    return matchSearch;
  });

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/40 via-background to-background p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-4xl space-y-6"
      >
        <motion.div variants={itemVariants}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gold-gradient shadow-lg shadow-gold/25">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white ring-2 ring-background"
                  >
                    {unreadCount}
                  </motion.div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Mes <span className="gold-text-gradient">Notifications</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {items.length} notification{items.length > 1 ? "s" : ""} · {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-gold-dark hover:bg-gold/10 disabled:opacity-50"
              >
                <CheckCheck className="mr-1.5 h-4 w-4" />
                Tout marquer lu
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={items.length === 0}
                className="text-red-600 hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Tout effacer
              </Button>
              <Button variant="ghost" size="icon" className="text-gold-dark hover:bg-gold/10">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <Card className="border-gold/20 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les notifications..."
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
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="flex h-auto flex-wrap gap-1.5 bg-transparent p-0">
                  {filterTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "h-9 rounded-xl border px-3.5 text-sm transition-all",
                        filter === tab.id
                          ? "gold-gradient text-primary-foreground border-transparent shadow-sm shadow-gold/20"
                          : "border-gold/20 bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
                      )}
                    >
                      {tab.label}
                      {tab.id === "unread" && unreadCount > 0 && (
                        <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-gold/20 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0], y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gold/10 text-gold-dark">
                    <MailOpen className="h-10 w-10" />
                  </div>
                </motion.div>
                <h3 className="text-lg font-bold">Aucune notification</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {items.length === 0
                    ? "Votre centre de notifications est vide. Les actualités de vos collaborations apparaîtront ici."
                    : "Aucune notification ne correspond à ce filtre ou à cette recherche."}
                </p>
                {items.length === 0 && (
                  <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
                    {[
                      { icon: Briefcase, title: "Demandes", desc: "Acceptations, mises à jour" },
                      { icon: MessageSquare, title: "Messages", desc: "Réponses talents" },
                      { icon: Sparkles, title: "Offres", desc: "Promotions & nouveautés" },
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
                )}
              </CardContent>
            ) : (
              <div className="divide-y divide-gold/10">
                <AnimatePresence initial={false}>
                  {filtered.map((n) => {
                    const cfg = typeConfig[n.type] || typeConfig.review;
                    const Ico = cfg.icon;
                    return (
                      <motion.div
                        key={n.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        layout
                        className={cn(
                          "group relative px-4 md:px-6 py-4 md:py-5 transition-colors cursor-pointer",
                          n.read ? "bg-background/40" : "bg-gold/[0.06]"
                        )}
                        onClick={() => markAsRead(n.id)}
                      >
                        {!n.read && (
                          <div className={cn("absolute left-0 top-0 bottom-0 w-1 gold-gradient")} />
                        )}
                        <div className="flex items-start gap-3 md:gap-4 pl-0">
                          <div className="shrink-0 relative">
                            {n.system ? (
                              <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", cfg.iconBg)}>
                                {n.promo ? (
                                  <div className="absolute inset-0 rounded-2xl animate-pulse-gold" />
                                ) : null}
                                <Ico className={cn("h-5 w-5 relative", cfg.iconColor)} />
                              </div>
                            ) : (
                              <Avatar className="h-11 w-11 ring-2 ring-gold/20 ring-offset-2 ring-offset-card">
                                <AvatarFallback className={cn("gold-gradient text-white text-xs font-bold")}>
                                  {n.actor.initials}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {!n.read && (
                                    <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dotColor)} />
                                  )}
                                  <h4 className={cn("font-semibold leading-snug", n.read ? "text-foreground" : "text-foreground")}>
                                    {n.title}
                                  </h4>
                                  {n.promo && (
                                    <Badge className="gap-1 text-[10px] gold-gradient text-primary-foreground">
                                      <Sparkles className="h-3 w-3" />
                                      Offre
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 md:line-clamp-1">
                                  {n.message}
                                </p>
                              </div>
                              <p className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">
                                {formatRelative(n.createdAt)}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {!n.read ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                    className="h-7 px-2 text-xs text-gold-dark hover:bg-gold/10"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                    Marquer lu
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:bg-gold/10"
                                  >
                                    Voir détails
                                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); }}
                                  className="h-7 w-7 text-muted-foreground hover:text-gold-dark hover:bg-gold/10"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
                                  className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
