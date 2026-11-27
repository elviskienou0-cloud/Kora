import { LanguageSwitcher, useI18n } from "@/i18n/kora-i18n.jsx"
import { useEffect, useState } from "react"
import {
  Outlet,
  NavLink,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  Bell,
  Settings,
  Users,
  FileText,
  CreditCard,
  ShieldCheck,
  LayoutDashboard,
  X,
  LogOut,
  User,
  ChevronRight,
  ChevronDown,
  Crown,
  BriefcaseBusiness,
  UserCheck,
  ContactRound,
  ScrollText,
  ClipboardList,
  UserCog,
  WalletCards,
  Megaphone,
} from "lucide-react"
import { useAuth } from "@/lib/AuthContext.jsx"
import { supabase } from "@/lib/supabase"
import useIsMobile from "@/hooks/use-mobile.jsx"
import { cn } from "@/lib/utils.js"
import AnnouncementTicker from "@/components/AnnouncementTicker.jsx"
import ThemeToggle from "@/components/ThemeToggle.jsx"
import koraLogo from "@/assets/kora-logo.svg"
import "@/styles/superadmin-glass.css"

function getMenuItems(t) {
  return {
    client: [
      {
        label: t("navigation.home"),
        href: "/home",
        icon: Home,
      },
      {
        label: t("navigation.discover"),
        href: "/client/browse",
        icon: Search,
      },
      {
        label: t("navigation.favorites"),
        href: "/client/favorites",
        icon: Heart,
      },
      {
        label: t("navigation.projects"),
        href: "/client/projects",
        icon: BriefcaseBusiness,
      },
      {
        label: t("navigation.requests"),
        href: "/client/requests",
        icon: FileText,
      },
      {
        label: t("navigation.messages"),
        href: "/messages",
        icon: MessageCircle,
      },
      {
        label: t("navigation.notifications"),
        href: "/client/notifications",
        icon: Bell,
      },
    ],

    manager: [
      {
        label: t("navigation.dashboard"),
        href: "/manager/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: t("navigation.talents"),
        href: "/manager/talents",
        icon: Users,
      },
      {
        label: t("navigation.requests"),
        href: "/manager/requests",
        icon: FileText,
      },
      {
        label: t("navigation.subscription"),
        href: "/manager/subscription",
        icon: CreditCard,
      },
      {
        label: t("navigation.messages"),
        href: "/messages",
        icon: MessageCircle,
      },
      {
        label: t("navigation.notifications"),
        href: "/manager/notifications",
        icon: Bell,
      },
      {
        label: t("manager.analyticsTitle"),
        href: "/manager/analytics",
        icon: LayoutDashboard,
      },
      {
        label: t("manager.teamTitle"),
        href: "/manager/team",
        icon: Users,
      },
      {
        label: t("navigation.settings"),
        href: "/manager/settings",
        icon: Settings,
      },
    ],

    superadmin: [
      {
        label: "Dashboard CEO",
        href: "/superadmin",
        icon: Crown,
      },
      {
        label: "Administrateurs",
        href: "/admin?view=administrators",
        icon: UserCog,
      },
      {
        label: "Utilisateurs",
        href: "/admin?view=users",
        icon: Users,
      },
      {
        label: "Managers",
        href: "/admin?view=managers",
        icon: UserCheck,
      },
      {
        label: "Clients",
        href: "/admin?view=clients",
        icon: Users,
      },
      {
        label: "Talents",
        href: "/admin?view=talents",
        icon: ContactRound,
      },
      {
        label: "Demandes",
        href: "/admin?view=requests",
        icon: ClipboardList,
      },
      {
        label: "Messages",
        href: "/admin?view=messages",
        icon: MessageCircle,
      },
      {
        label: "Projets",
        href: "/admin?view=projects",
        icon: BriefcaseBusiness,
      },
      {
        label: "Paiements",
        href: "/admin?view=payments",
        icon: WalletCards,
      },
      {
        label: "Abonnements",
        href: "/admin?view=subscriptions",
        icon: CreditCard,
      },
      {
        label: "Annonces",
        href: "/admin?view=announcements",
        icon: Megaphone,
      },
      {
        label: "Modération",
        href: "/admin?view=moderation",
        icon: ShieldCheck,
      },
      {
        label: "Logs",
        href: "/admin?view=logs",
        icon: ScrollText,
      },
      {
        label: "Paramètres",
        href: "/admin?view=settings",
        icon: Settings,
      },
    ],

    admin: [
      {
        label: "Tableau de bord",
        href: "/admin",
        icon: LayoutDashboard,
        view: "dashboard",
      },
      {
        label: "Utilisateurs",
        href: "/admin?view=users",
        icon: Users,
        view: "users",
      },
      {
        label: "Managers",
        href: "/admin?view=managers",
        icon: UserCog,
        view: "managers",
      },
      {
        label: "Clients",
        href: "/admin?view=clients",
        icon: UserCheck,
        view: "clients",
      },
      {
        label: "Talents",
        href: "/admin?view=talents",
        icon: ContactRound,
        view: "talents",
      },
      {
        label: "Demandes",
        href: "/admin?view=requests",
        icon: ClipboardList,
        view: "requests",
      },
      {
        label: "Projets",
        href: "/admin?view=projects",
        icon: BriefcaseBusiness,
        view: "projects",
      },
      {
        label: "Messages",
        href: "/admin?view=messages",
        icon: MessageCircle,
        view: "messages",
      },
      {
        label: "Paiements",
        href: "/admin?view=payments",
        icon: WalletCards,
        view: "payments",
      },
      {
        label: "Abonnements",
        href: "/admin?view=subscriptions",
        icon: CreditCard,
        view: "subscriptions",
      },
      {
        label: "Annonces",
        href: "/admin?view=announcements",
        icon: Megaphone,
        view: "announcements",
      },
      {
        label: "Modération",
        href: "/admin?view=moderation",
        icon: ShieldCheck,
        view: "moderation",
      },
      {
        label: "Logs",
        href: "/admin?view=logs",
        icon: ScrollText,
        view: "logs",
      },
      {
        label: "Paramètres",
        href: "/admin?view=settings",
        icon: Settings,
        view: "settings",
      },
      {
        label: "Admins & associés",
        href: "/admin?view=administrators",
        icon: UserCog,
        view: "administrators",
        superAdminOnly: true,
      },
    ],
  }
}


const SUPERADMIN_NAV_GROUPS = [
  {
    label: "Gestion globale",
    icon: Users,
    items: [
      { label: "Utilisateurs", href: "/admin?view=users", icon: Users, view: "users" },
      { label: "Managers", href: "/admin?view=managers", icon: UserCog, view: "managers" },
      { label: "Clients", href: "/admin?view=clients", icon: UserCheck, view: "clients" },
      { label: "Talents", href: "/admin?view=talents", icon: ContactRound, view: "talents" },
      { label: "Administrateurs", href: "/admin?view=administrators", icon: ShieldCheck, view: "administrators" },
    ],
  },
  {
    label: "Activité",
    icon: BriefcaseBusiness,
    items: [
      { label: "Demandes", href: "/admin?view=requests", icon: ClipboardList, view: "requests" },
      { label: "Messages", href: "/admin?view=messages", icon: MessageCircle, view: "messages" },
      { label: "Projets", href: "/admin?view=projects", icon: BriefcaseBusiness, view: "projects" },
      { label: "Paiements", href: "/admin?view=payments", icon: WalletCards, view: "payments" },
      { label: "Abonnements", href: "/admin?view=subscriptions", icon: CreditCard, view: "subscriptions" },
    ],
  },
  {
    label: "Contenus",
    icon: FileText,
    items: [
      { label: "Annonces", href: "/admin?view=announcements", icon: Megaphone, view: "announcements" },
      { label: "Modération", href: "/admin?view=moderation", icon: ShieldCheck, view: "moderation" },
      { label: "Journaux", href: "/admin?view=logs", icon: ScrollText, view: "logs" },
    ],
  },
  {
    label: "Paramètres",
    icon: Settings,
    items: [
      { label: "Configuration", href: "/admin?view=settings", icon: Settings, view: "settings" },
    ],
  },
]

function getRoleLabels(t) {
  return {
    client: {
      label: t("account.client"),
      badge: "bg-emerald-500",
    },
    manager: {
      label: t("account.manager"),
      badge: "bg-gold",
    },
    talent: {
      label: t("account.talent"),
      badge: "bg-purple-500",
    },
    admin: {
      label: t("account.admin"),
      badge: "bg-red-500",
    },
    superadmin: {
      label: "SuperAdmin / CEO",
      badge: "bg-gold",
    },
  }
}

export default function KoraLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const { t } = useI18n()

  const menuItems = getMenuItems(t)
  const roleLabels = getRoleLabels(t)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [adminAccess, setAdminAccess] = useState(null)
  const [expandedAdminGroups, setExpandedAdminGroups] = useState({})

  const role = user?.role

  // ==========================================================
  // CHARGEMENT DES DROITS ADMIN
  // ==========================================================

  useEffect(() => {
    let mounted = true

    if (role === "admin") {
      supabase.rpc("get_my_admin_access").then(({ data, error }) => {
        if (!mounted) return

        if (error) {
          console.error(
            "[KORA] Erreur récupération des droits admin :",
            error
          )
          setAdminAccess(null)
          return
        }

        if (data) {
          setAdminAccess(data)
        }
      })
    } else {
      setAdminAccess(null)
    }

    return () => {
      mounted = false
    }
  }, [role])

  // ==========================================================
  // PERMISSIONS ADMIN
  // ==========================================================

  const permissionMap = {
    users: "users.read",
    managers: "managers.read",
    clients: "users.read",
    talents: "talents.read",
    requests: "requests.read",
    projects: "projects.read",
    messages: "messages.read",
    payments: "payments.read",
    subscriptions: "subscriptions.read",
    announcements: "announcements.write",
    moderation: "moderation.read",
    logs: "logs.read",
    settings: "settings.read",
  }

  const rawMenu = menuItems[role] || menuItems.client

  const menu =
    role === "admin" &&
    adminAccess?.access_level === "associate"
      ? rawMenu.filter(
          (item) =>
            !item.superAdminOnly &&
            (
              item.view === "dashboard" ||
              Boolean(
                adminAccess?.permissions?.["*"] ||
                adminAccess?.permissions?.[permissionMap[item.view]]
              )
            )
        )
      : rawMenu.filter(
          (item) =>
            !item.superAdminOnly ||
            adminAccess?.access_level !== "associate"
        )

  const roleInfo = roleLabels[role] || roleLabels.client

  const homeHref =
    role === "superadmin"
      ? "/superadmin"
      : role === "admin"
        ? "/admin"
        : role === "manager"
          ? "/manager/dashboard"
          : "/home"

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate("/")
    }
  }

  // ==========================================================
  // SIDEBAR
  // ==========================================================

  const renderSidebarContent = () => (
    <aside className="flex flex-col h-full">
      <div className="p-5 border-b border-sidebar-border">
        <Link
          to={homeHref}
          className="flex items-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-border group-hover:ring-gold/40 transition-all">
            <img
              src={koraLogo}
              alt="KORA"
              className="w-full h-full object-cover"
            />
          </div>

          <span className="text-xl font-bold font-display tracking-tight text-foreground">
            KORA
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {role === "superadmin" ? (
          <div className="space-y-2">
            <NavLink
              to="/superadmin"
              end
              onClick={() => isMobile && setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                isActive
                  ? "kora-superadmin-active-nav"
                  : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-white"
              )}
            >
              <Crown className="h-[18px] w-[18px]" />
              <span>Tableau de bord</span>
            </NavLink>

            {SUPERADMIN_NAV_GROUPS.map((group) => {
              const currentView = new URLSearchParams(location.search).get("view") || "dashboard"
              const groupIsActive = group.items.some((item) => item.view === currentView)
              const isOpen = Boolean(expandedAdminGroups[group.label] || groupIsActive)
              const GroupIcon = group.icon

              return (
                <section key={group.label} className="pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedAdminGroups((current) => ({
                      ...current,
                      [group.label]: !isOpen,
                    }))}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/55 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <GroupIcon className="h-4 w-4 text-gold" />
                    <span className="flex-1">{group.label}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </button>

                  {isOpen && (
                    <ul className="mt-1 space-y-1 pl-3">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon
                        const active = currentView === item.view && location.pathname === "/admin"
                        return (
                          <li key={item.view}>
                            <NavLink
                              to={item.href}
                              onClick={() => isMobile && setSidebarOpen(false)}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                active
                                  ? "kora-superadmin-active-nav"
                                  : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              <ItemIcon className="h-4 w-4 shrink-0" />
                              <span>{item.label}</span>
                            </NavLink>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        ) : (
          <ul className="space-y-1">
            {menu.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={({ isActive }) => {
                    const currentView = new URLSearchParams(location.search).get("view") || "dashboard"
                    const active = role === "admin" ? currentView === (item.view || "dashboard") : isActive
                    return cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                      active
                        ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )
                  }}
                >
                  <item.icon className="h-5 w-5 text-sidebar-foreground/70 transition-colors group-hover:text-gold" />
                  <span>{item.label}</span>
                  <ChevronRight className="ml-auto h-4 w-4 -translate-x-2 text-gold opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {role !== "admin" && role !== "superadmin" && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl bg-sidebar-accent/50 p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-gold" />

              <span className="text-xs font-semibold">
                {t("premium.title")}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground mb-2">
              {t("premium.description")}
            </p>

            <button className="w-full py-1.5 rounded-lg gold-gradient text-white text-xs font-medium hover:opacity-90 transition-opacity">
              {t("premium.button")}
            </button>
          </div>
        </div>
      )}

      <div className="p-3 border-t border-sidebar-border">
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent/50 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-sidebar-background",
                roleInfo.badge
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || t("account.name")}
            </p>

            <p className="text-xs text-muted-foreground truncate">
              {roleInfo.label}
            </p>
          </div>

          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              menuOpen && "rotate-180"
            )}
          />
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.ul
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              className="overflow-hidden mt-2 space-y-0.5"
            >
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)

                    if (role === "client") {
                      navigate("/client/profile")
                    } else if (role === "manager") {
                      navigate("/manager/settings")
                    } else if (
                      role === "admin" ||
                      role === "superadmin"
                    ) {
                      navigate("/admin?view=settings")
                    } else {
                      navigate("/home")
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                >
                  <User className="h-4 w-4" />

                  <span>
                    {t("account.profile")}
                  </span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)

                    if (role === "client") {
                      navigate("/client/settings")
                    } else if (role === "manager") {
                      navigate("/manager/settings")
                    } else if (
                      role === "admin" ||
                      role === "superadmin"
                    ) {
                      navigate("/admin?view=settings")
                    } else {
                      navigate("/home")
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                >
                  <Settings className="h-4 w-4" />

                  <span>
                    {t("navigation.settings")}
                  </span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />

                  <span>
                    {t("account.logout")}
                  </span>
                </button>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className={cn("kora-workspace min-h-screen flex", role === "superadmin" ? "kora-superadmin-glass" : "bg-background")}
      data-kora-role={role || "client"}>
      {!isMobile && (
        <div className="w-64 shrink-0 h-screen sticky top-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          {renderSidebarContent()}
        </div>
      )}

      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
              }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>

              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Ouvrir le menu"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-none stroke-current stroke-2"
                    aria-hidden="true"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}

              {role === "admin" || role === "superadmin" ? (
                <form
                  className="relative hidden w-[min(420px,40vw)] sm:block"
                  onSubmit={(e) => {
                    e.preventDefault()

                    const q =
                      new FormData(e.currentTarget)
                        .get("q")
                        ?.toString()
                        .trim() || ""

                    navigate(
                      `/admin?view=users${
                        q
                          ? `&q=${encodeURIComponent(q)}`
                          : ""
                      }`
                    )
                  }}
                >
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    name="q"
                    type="search"
                    placeholder="Rechercher un utilisateur…"
                    className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-gold/60"
                  />
                </form>
              ) : (
                <>
                  <div className="hidden sm:block text-sm font-medium text-muted-foreground shrink-0">
                    KORA
                  </div>

                  <AnnouncementTicker />
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher compact />

              <ThemeToggle />

              {role !== "admin" &&
                role !== "superadmin" && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/messages")
                    }
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                    aria-label={t(
                      "navigation.messages"
                    )}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                )}

              <div className="h-8 w-px bg-border mx-1" />

              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold leading-none">
                  {user?.name || t("account.name")}
                </p>

                <p className="text-[11px] text-gold-dark mt-1">
                  {roleInfo.label}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}