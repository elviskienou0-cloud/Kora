import { useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { ChevronDown, LogOut, UserRound, Settings, LayoutDashboard, Users, BriefcaseBusiness, FileText, MessageCircle, Bell, CreditCard, BarChart3, FolderKanban, Search, Heart } from "lucide-react"
import { LanguageSwitcher } from "@/i18n/kora-i18n.jsx"
import ThemeToggle from "@/components/ThemeToggle.jsx"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { cn } from "@/lib/utils.js"
import koraLogo from "@/assets/kora-logo.svg"

const CLIENT_LINKS = [
  { href: "/client/browse", key: "navigation.discover", Icon: Search },
  { href: "/client/favorites", key: "navigation.favorites", Icon: Heart },
  { href: "/client/projects", key: "navigation.projects", Icon: FolderKanban },
  { href: "/client/requests", key: "navigation.requests", Icon: FileText },
  { href: "/messages", key: "navigation.messages", Icon: MessageCircle },
]

const MANAGER_GROUPS = [
  { key: "global", fr: "Gestion globale", en: "Overview", Icon: LayoutDashboard, paths: ["/manager/dashboard", "/manager/subscription"] },
  { key: "activity", fr: "Activité", en: "Activity", Icon: BriefcaseBusiness, paths: ["/manager/requests", "/manager/projects", "/messages", "/manager/notifications", "/manager/analytics", "/manager/team"] },
  { key: "content", fr: "Contenus", en: "Content", Icon: Users, paths: ["/manager/talents"] },
]

const MANAGER_ICONS = {
  "/manager/dashboard": LayoutDashboard,
  "/manager/talents": Users,
  "/manager/requests": FileText,
  "/manager/projects": BriefcaseBusiness,
  "/manager/subscription": CreditCard,
  "/messages": MessageCircle,
  "/manager/notifications": Bell,
  "/manager/analytics": BarChart3,
  "/manager/team": Users,
}

function isPathActive(pathname, href) {
  return href === "/messages" ? pathname === href : pathname === href || pathname.startsWith(href + "/")
}

export default function KoraWorkspaceNav({ role, menu = [], user, roleLabel, onLogout }) {
  const { t, language } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const [openGroup, setOpenGroup] = useState("")
  const [accountOpen, setAccountOpen] = useState(false)
  const isManager = role === "manager"
  const visibleManagerItems = menu.filter((item) => item.href !== "/manager/settings")
  const managerGroups = MANAGER_GROUPS.map((group) => ({
    ...group,
    items: visibleManagerItems.filter((item) => group.paths.includes(item.href)),
  })).filter((group) => group.items.length > 0)

  const renderLink = (item, compact = false) => {
    const Icon = item.Icon || item.icon || MANAGER_ICONS[item.href] || FileText
    return (
      <NavLink
        key={item.href}
        to={item.href}
        end={item.href === "/messages"}
        onClick={() => setOpenGroup("")}
        aria-current={isPathActive(location.pathname, item.href) ? "page" : undefined}
        className={({ isActive }) => cn(
          "kora-workspace-nav-link",
          (isActive || isPathActive(location.pathname, item.href)) && "is-active",
          compact && "is-compact"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{item.label || t(item.key)}</span>
      </NavLink>
    )
  }

  return (
    <div className="kora-workspace-nav-inner">
      <Link to={role === "manager" ? "/manager/dashboard" : "/client/browse"} className="kora-workspace-brand" aria-label="KORA, accueil">
        <img src={koraLogo} alt="" width="32" height="32" />
        <span>KORA</span>
      </Link>

      <nav className="kora-workspace-primary-nav" aria-label={isManager ? (language === "fr" ? "Navigation manager" : "Manager navigation") : (language === "fr" ? "Navigation client" : "Client navigation")}>
        {isManager ? managerGroups.map((group) => {
          const GroupIcon = group.Icon
          const active = group.items.some((item) => isPathActive(location.pathname, item.href))
          const open = openGroup === group.key
          return (
            <div className="kora-workspace-nav-group" key={group.key}>
              <button type="button" className={cn("kora-workspace-nav-group-trigger", (active || open) && "is-active")} aria-expanded={open} onClick={() => setOpenGroup(open ? "" : group.key)}>
                <GroupIcon className="h-4 w-4" aria-hidden="true" />
                <span>{language === "fr" ? group.fr : group.en}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
              </button>
              {open && (
                <>
                  <button type="button" className="kora-workspace-nav-dismiss" aria-label={language === "fr" ? "Fermer le menu" : "Close menu"} onClick={() => setOpenGroup("")} />
                  <div className="kora-workspace-nav-popover">
                    {group.items.map((item) => renderLink(item, true))}
                  </div>
                </>
              )}
            </div>
          )
        }) : CLIENT_LINKS.map((entry) => {
          const item = menu.find((candidate) => candidate.href === entry.href)
          return item ? renderLink({ ...item, Icon: entry.Icon }) : null
        })}
      </nav>

      <div className="kora-workspace-nav-actions">
        {role === "manager" && <Link to="/manager/settings" className={cn("kora-workspace-icon-action", location.pathname.startsWith("/manager/settings") && "is-active")} aria-label={t("navigation.settings")} title={t("navigation.settings")}><Settings className="h-[18px] w-[18px]" /></Link>}
        {role === "client" && <Link to="/client/settings" className={cn("kora-workspace-icon-action", location.pathname.startsWith("/client/settings") && "is-active")} aria-label={t("navigation.settings")} title={t("navigation.settings")}><Settings className="h-[18px] w-[18px]" /></Link>}
        <LanguageSwitcher compact />
        <ThemeToggle />
        <div className="kora-workspace-account">
          <button type="button" className="kora-workspace-account-trigger" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-label={language === "fr" ? "Menu du compte" : "Account menu"}>
            <span className="kora-workspace-avatar">{user?.name?.trim()?.charAt(0)?.toUpperCase() || "K"}</span>
            <span className="kora-workspace-account-name">{user?.name || t("account.name")}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", accountOpen && "rotate-180")} />
          </button>
          {accountOpen && (
            <>
              <button type="button" className="kora-workspace-nav-dismiss" aria-label={language === "fr" ? "Fermer le menu du compte" : "Close account menu"} onClick={() => setAccountOpen(false)} />
              <div className="kora-workspace-account-menu">
                <div className="kora-workspace-account-meta"><strong>{user?.name || t("account.name")}</strong><span>{roleLabel}</span></div>
                <button type="button" onClick={() => { setAccountOpen(false); navigate(role === "client" ? "/client/profile" : "/manager/settings") }}><UserRound className="h-4 w-4" />{t("account.profile")}</button>
                <button type="button" onClick={() => { setAccountOpen(false); navigate(role === "client" ? "/client/settings" : "/manager/settings") }}><Settings className="h-4 w-4" />{t("navigation.settings")}</button>
                <button type="button" className="is-danger" onClick={onLogout}><LogOut className="h-4 w-4" />{t("account.logout")}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
