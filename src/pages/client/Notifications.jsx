import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDate } from "@/lib/utils";
import {
  Bell,
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
  MailOpen,
  ChevronRight,
  FileText,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

const typeConfig = {
  request_accepted: {
    icon: Briefcase,
    dotColor: "bg-emerald-500",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600",
  },
  request_status: {
    icon: FileText,
    dotColor: "bg-blue-500",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-600",
  },
  request_declined: {
    icon: AlertCircle,
    dotColor: "bg-red-500",
    iconBg: "bg-red-500/15",
    iconColor: "text-red-600",
  },
  new_message: {
    icon: MessageSquare,
    dotColor: "bg-blue-500",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-600",
  },
  new_favorite: {
    icon: Heart,
    dotColor: "bg-rose-500",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-500",
  },
  review: {
    icon: Star,
    dotColor: "bg-gold",
    iconBg: "bg-gold/15",
    iconColor: "text-gold-dark",
  },
  system_promo: {
    icon: Gift,
    dotColor: "bg-purple-500",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-600",
  },
  payment_success: {
    icon: CheckCheck,
    dotColor: "bg-emerald-500",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600",
  },
};

const defaultTypeConfig = {
  icon: Bell,
  dotColor: "bg-muted-foreground",
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
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
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.3 },
  },
};

function formatRelative(dateISO) {
  if (!dateISO) return "";

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
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const authId = user?.authId;

  /*
   * ============================================================
   * CHARGEMENT DES NOTIFICATIONS
   * ============================================================
   */
  useEffect(() => {
    if (authLoading) return;

    if (!authId) {
      console.warn("Notifications : aucun authId disponible", user);
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadNotifications() {
      setLoading(true);
      setError("");

      console.log("Notifications : chargement pour user_id =", authId);

      try {
        const { data, error: notifError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", authId)
          .order("created_at", { ascending: false });

        if (notifError) {
          throw notifError;
        }

        console.log(
          "Notifications récupérées :",
          data?.length || 0,
          data
        );

        if (!cancelled) {
          setItems(data || []);
        }
      } catch (err) {
        console.error(
          "Erreur chargement notifications :",
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              "Impossible de charger vos notifications."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [authLoading, authId]);

  /*
   * ============================================================
   * TEMPS RÉEL SUPABASE
   * ============================================================
   */
  useEffect(() => {
    if (authLoading || !authId) return;

    console.log(
      "Notifications : activation du temps réel pour",
      authId
    );

    const channel = supabase
      .channel(`notifications-${authId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${authId}`,
        },
        (payload) => {
          console.log(
            "Nouvelle notification reçue en temps réel :",
            payload.new
          );

          setItems((prev) => {
            const exists = prev.some(
              (item) => item.id === payload.new.id
            );

            if (exists) {
              return prev;
            }

            return [payload.new, ...prev];
          });
        }
      )
      .subscribe((status) => {
        console.log(
          "Statut realtime notifications :",
          status
        );
      });

    return () => {
      console.log(
        "Notifications : fermeture du canal realtime"
      );

      supabase.removeChannel(channel);
    };
  }, [authLoading, authId]);

  /*
   * ============================================================
   * MARQUER UNE NOTIFICATION COMME LUE
   * ============================================================
   */
  const markAsRead = async (id) => {
    const previous = items;

    setItems((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, is_read: true }
          : n
      )
    );

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", authId);

    if (updateError) {
      console.error(
        "Erreur marquage lu :",
        updateError
      );

      setItems(previous);
    }
  };

  /*
   * ============================================================
   * TOUT MARQUER COMME LU
   * ============================================================
   */
  const markAllAsRead = async () => {
    const previous = items;

    const unreadIds = items
      .filter((n) => !n.is_read)
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
      }))
    );

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
      .eq("user_id", authId);

    if (updateError) {
      console.error(
        "Erreur marquage global lu :",
        updateError
      );

      setItems(previous);
    }
  };

  /*
   * ============================================================
   * SUPPRIMER UNE NOTIFICATION
   * ============================================================
   */
  const deleteOne = async (id) => {
    const previous = items;

    setItems((prev) =>
      prev.filter((n) => n.id !== id)
    );

    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", authId);

    if (deleteError) {
      console.error(
        "Erreur suppression notification :",
        deleteError
      );

      setItems(previous);
    }
  };

  /*
   * ============================================================
   * TOUT EFFACER
   * ============================================================
   */
  const clearAll = async () => {
    const previous = items;

    const ids = items.map((n) => n.id);

    if (ids.length === 0) return;

    setItems([]);

    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .in("id", ids)
      .eq("user_id", authId);

    if (deleteError) {
      console.error(
        "Erreur suppression globale :",
        deleteError
      );

      setItems(previous);
    }
  };

  /*
   * ============================================================
   * OUVRIR UNE NOTIFICATION
   * ============================================================
   */
  const handleOpen = async (n) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }

    if (n.link) {
      navigate(n.link);
    }
  };

  /*
   * ============================================================
   * FILTRES
   * ============================================================
   */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return items.filter((n) => {
      const matchSearch =
        !q ||
        (n.title || "")
          .toLowerCase()
          .includes(q) ||
        (n.message || "")
          .toLowerCase()
          .includes(q);

      if (!matchSearch) return false;

      if (filter === "unread" && n.is_read) {
        return false;
      }

      if (
        filter === "requests" &&
        !(n.type || "").startsWith("request")
      ) {
        return false;
      }

      if (
        filter === "messages" &&
        n.type !== "new_message"
      ) {
        return false;
      }

      if (
        filter === "system" &&
        (
          (n.type || "").startsWith("request") ||
          n.type === "new_message"
        )
      ) {
        return false;
      }

      return true;
    });
  }, [items, filter, search]);

  const unreadCount = items.filter(
    (n) => !n.is_read
  ).length;

  /*
   * ============================================================
   * CHARGEMENT
   * ============================================================
   */
  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>
            Chargement des notifications...
          </span>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * AFFICHAGE
   * ============================================================
   */
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
                  Mes{" "}
                  <span className="gold-text-gradient">
                    Notifications
                  </span>
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  {items.length} notification
                  {items.length > 1 ? "s" : ""} ·{" "}
                  {unreadCount} non lue
                  {unreadCount > 1 ? "s" : ""}
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
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants}>
            <Card className="border-destructive">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />

                <p className="flex-1 text-sm text-destructive">
                  {error}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.location.reload()
                  }
                >
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="space-y-4"
        >
          <Card className="border-gold/20 shadow-sm">
            <CardContent className="space-y-4 p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Rechercher dans les notifications..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="h-11 border-gold/30 pl-11 pr-10 focus:border-gold focus:ring-gold/30"
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

              <Tabs
                value={filter}
                onValueChange={setFilter}
              >
                <TabsList className="flex h-auto flex-wrap gap-1.5 bg-transparent p-0">
                  {filterTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "h-9 rounded-xl border px-3.5 text-sm transition-all",
                        filter === tab.id
                          ? "gold-gradient border-transparent text-primary-foreground shadow-sm shadow-gold/20"
                          : "border-gold/20 bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
                      )}
                    >
                      {tab.label}

                      {tab.id === "unread" &&
                        unreadCount > 0 && (
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
          <Card className="overflow-hidden border-gold/20 shadow-sm">
            {filtered.length === 0 ? (
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <motion.div
                  animate={{
                    rotate: [0, 8, -8, 0],
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gold/10 text-gold-dark">
                    <MailOpen className="h-10 w-10" />
                  </div>
                </motion.div>

                <h3 className="text-lg font-bold">
                  Aucune notification
                </h3>

                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {items.length === 0
                    ? "Votre centre de notifications est vide. Les actualités de vos collaborations apparaîtront ici."
                    : "Aucune notification ne correspond à ce filtre ou à cette recherche."}
                </p>

                {items.length === 0 && (
                  <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
                    {[
                      {
                        icon: Briefcase,
                        title: "Demandes",
                        desc: "Acceptations, mises à jour",
                      },
                      {
                        icon: MessageSquare,
                        title: "Messages",
                        desc: "Réponses talents",
                      },
                      {
                        icon: Sparkles,
                        title: "Offres",
                        desc: "Promotions & nouveautés",
                      },
                    ].map((f, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-xl border border-gold/15 bg-card p-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
                          <f.icon className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {f.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {f.desc}
                          </p>
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
                    const cfg =
                      typeConfig[n.type] ||
                      defaultTypeConfig;

                    const Ico = cfg.icon;

                    return (
                      <motion.div
                        key={n.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{
                          opacity: 0,
                          height: 0,
                          marginBottom: 0,
                        }}
                        layout
                        className={cn(
                          "group relative cursor-pointer px-4 py-4 transition-colors md:px-6 md:py-5",
                          n.is_read
                            ? "bg-background/40"
                            : "bg-gold/[0.06]"
                        )}
                        onClick={() =>
                          handleOpen(n)
                        }
                      >
                        {!n.is_read && (
                          <div className="absolute bottom-0 left-0 top-0 w-1 gold-gradient" />
                        )}

                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="relative shrink-0">
                            <div
                              className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-2xl",
                                cfg.iconBg
                              )}
                            >
                              <Ico
                                className={cn(
                                  "h-5 w-5",
                                  cfg.iconColor
                                )}
                              />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  {!n.is_read && (
                                    <span
                                      className={cn(
                                        "h-2 w-2 shrink-0 rounded-full",
                                        cfg.dotColor
                                      )}
                                    />
                                  )}

                                  <h4 className="font-semibold leading-snug text-foreground">
                                    {n.title ||
                                      "Notification"}
                                  </h4>
                                </div>

                                {n.message && (
                                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground md:line-clamp-1">
                                    {n.message}
                                  </p>
                                )}
                              </div>

                              <p className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
                                {formatRelative(
                                  n.created_at
                                )}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {!n.is_read ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(n.id);
                                    }}
                                    className="h-7 px-2 text-xs text-gold-dark hover:bg-gold/10"
                                  >
                                    <Check className="mr-1 h-3.5 w-3.5" />
                                    Marquer lu
                                  </Button>
                                ) : n.link ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(n.link);
                                    }}
                                    className="h-7 px-2 text-xs text-muted-foreground hover:bg-gold/10"
                                  >
                                    Voir détails
                                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                  </Button>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteOne(n.id);
                                  }}
                                  className="h-7 w-7 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
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
