import { useState } from "react"
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom"
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
  Menu,
  X,
  LogOut,
  User,
  ChevronRight,
  Sparkles,
  ChevronDown,
  Crown,
} from "lucide-react"
import { useAuth } from "@/lib/AuthContext.jsx"
import useIsMobile from "@/hooks/use-mobile.jsx"
import { cn } from "@/lib/utils.js"

const MENU_ITEMS = {
  client: [
    {
      label: "Accueil",
      href: "/home",
      icon: Home,
    },
    {
      label: "Découvrir",
      href: "/client/browse",
      icon: Search,
    },
    {
      label: "Mes favoris",
      href: "/client/favorites",
      icon: Heart,
    },
    {
      label: "Mes demandes",
      href: "/client/requests",
      icon: FileText,
    },
    {
      label: "Messages",
      href: "/messages",
      icon: MessageCircle,
    },
    {
      label: "Notifications",
      href: "/client/notifications",
      icon: Bell,
    },
  ],
  manager: [
    {
      label: "Tableau de bord",
      href: "/manager/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Mes talents",
      href: "/manager/talents",
      icon: Users,
    },
    {
      label: "Demandes",
      href: "/manager/requests",
      icon: FileText,
    },
    {
      label: "Abonnement",
      href: "/manager/subscription",
      icon: CreditCard,
    },
    {
      label: "Messages",
      href: "/messages",
      icon: MessageCircle,
    },
    {
      label: "Paramètres",
      href: "/manager/settings",
      icon: Settings,
    },
  ],
  admin: [
    {
      label: "Administration",
      href: "/admin",
      icon: ShieldCheck,
    },
    {
      label: "Accueil",
      href: "/home",
      icon: Home,
    },
    {
      label: "Clients",
      href: "/client/browse",
      icon: Search,
    },
    {
      label: "Demandes",
      href: "/manager/requests",
      icon: FileText,
    },
    {
      label: "Messages",
      href: "/messages",
      icon: MessageCircle,
    },
  ],
}

const ROLE_LABELS = {
  client: { label: "Client", badge: "bg-emerald-500" },
  manager: { label: "Manager", badge: "bg-gold" },
  talent: { label: "Talent", badge: "bg-purple-500" },
  admin: { label: "Administrateur", badge: "bg-red-500" },
}

export default function KoraLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const menu = MENU_ITEMS[user?.role] || MENU_ITEMS.client
  const roleInfo = ROLE_LABELS[user?.role] || ROLE_LABELS.client

  const handleLogout = async () => {
  await logout()
  navigate("/")
}

  const SidebarContent = () => (
    <aside className="flex flex-col h-full">
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/home" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/25 group-hover:shadow-gold/40 transition-shadow">
          <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold gold-text-gradient font-display tracking-tight">
            KORA
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {menu.map((item) => (
            <li key={item.href}>
              <NavLink
              to={item.href}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  "text-sidebar-foreground/70 group-hover:text-gold"
                )}
              />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-gold" />
            </NavLink>
          </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-xl bg-sidebar-accent/50 p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-4 w-4 text-gold" />
            <span className="text-xs font-semibold">Passer Premium</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Débloquez toutes les fonctionnalités
          </p>
          <button className="w-full py-1.5 rounded-lg gold-gradient text-white text-xs font-medium hover:opacity-90 transition-opacity">
            Mettre à jour
          </button>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent/50 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-sidebar-background",
              roleInfo.badge
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground truncate">{roleInfo.label}</p>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2 space-y-0.5"
            >
              <li>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
                  <User className="h-4 w-4" />
                  <span>Mon profil</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
                  <Settings className="h-4 w-4" />
                  <span>Paramètres</span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-background flex">
      {!isMobile && (
        <div className="w-64 shrink-0 h-screen sticky top-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarContent />
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent />
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
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold">Bienvenue,</h1>
              <p className="text-sm text-muted-foreground">{user?.name || "Utilisateur"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold ring-2 ring-background" />
            </button>
            <button className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors relative">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
            </button>

            <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-xl border border-border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-white text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            </div>
          </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
