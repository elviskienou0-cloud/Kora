import { useState } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  FolderKanban,
  Loader2,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Star,
  UserCheck,
  UserCog,
  Users,
  WalletCards,
  X,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminOverviewQuery, useActiveAnnouncementQuery } from "@/hooks/queries/useAdminOverviewQuery"

const GOLD = "#E7B23C"
const BLUE = "#3B82F6"
const GRAY = "#8A8F98"
const VIOLET = "#A855F7"

const nf = new Intl.NumberFormat("fr-FR")
const formatNumber = (n) => nf.format(Number(n || 0))

function growth(now, prev) {
  const a = Number(now || 0)
  const b = Number(prev || 0)
  if (b > 0) return Math.round(((a - b) / b) * 100)
  if (a > 0) return null // pas de base de comparaison : « nouveau »
  return 0
}

function formatDateTime(value) {
  if (!value) return "—"
  return new Date(value)
    .toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    .replace(", ", " - ")
}
const formatDate = (value) => (value ? new Date(value).toLocaleDateString("fr-FR") : "—")

const ROLE_LABELS = { client: "Client", manager: "Manager", admin: "Admin", super_admin: "Super admin" }
const ROLE_STYLES = {
  client: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  manager: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  admin: "bg-gold/20 text-gold-dark",
  super_admin: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
}
const REQUEST_STATUS = {
  pending: ["En attente", "warn"],
  accepted: ["Acceptée", "ok"],
  rejected: ["Refusée", "bad"],
  in_progress: ["En cours", "info"],
  completed: ["Terminée", "ok"],
  cancelled: ["Annulée", "muted"],
}
const PAYMENT_STATUS = {
  pending: ["En attente", "warn"],
  paid: ["Validé", "ok"],
  approved: ["Validé", "ok"],
  rejected: ["Rejeté", "bad"],
  failed: ["Échoué", "bad"],
  cancelled: ["Annulé", "muted"],
  refunded: ["Remboursé", "info"],
}
const TONES = {
  ok: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warn: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  bad: "bg-red-500/15 text-red-600 dark:text-red-400",
  info: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  muted: "bg-muted text-muted-foreground",
}

function Pill({ tone, children }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>{children}</span>
}

function initialsOf(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?"
}

function Avatar({ name, src }) {
  return src ? (
    <img src={src} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
      {initialsOf(name)}
    </span>
  )
}

function KpiCard({ icon: Icon, label, value, delta, hint = "vs mois dernier" }) {
  const isNew = delta === null
  const positive = isNew || (delta ?? 0) >= 0
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{label}</p>
            <p className="truncate text-xl font-black leading-tight">{value}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-col items-center text-center text-xs">
          <span className={`inline-flex items-center gap-1 font-semibold ${positive ? "text-emerald-500" : "text-red-500"}`}>
            <DeltaIcon className="h-3.5 w-3.5" />
            {isNew ? "Nouveau" : `${delta >= 0 ? "+" : ""}${delta}%`}
          </span>
          <span className="text-muted-foreground">{hint}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function Panel({ title, icon: Icon, action, children, className = "" }) {
  return (
    <Card className={`border-border/60 ${className}`}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {Icon ? <Icon className="h-5 w-5" /> : null}
            <h2 className="font-black">{title}</h2>
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function SeeAll({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
      Voir tout <ArrowUpRight className="h-3.5 w-3.5" />
    </button>
  )
}

function Empty({ children }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
}

const dismissKey = (id) => `kora-admin-banner-dismissed:${id}`
function isDismissed(id) {
  try { return localStorage.getItem(dismissKey(id)) === "1" } catch { return false }
}

function AnnouncementBanner({ onNavigate }) {
  const { data: announcement } = useActiveAnnouncementQuery()
  const [, force] = useState(0)
  if (!announcement || isDismissed(announcement.id)) return null
  const dismiss = () => {
    try { localStorage.setItem(dismissKey(announcement.id), "1") } catch { /* stockage indisponible */ }
    force((n) => n + 1)
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3">
      <Megaphone className="h-5 w-5 shrink-0 text-gold-dark" />
      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="font-black">{announcement.title}</span>
        {announcement.content ? <span className="text-muted-foreground"> : {announcement.content}</span> : null}
      </p>
      <button type="button" onClick={() => onNavigate("announcements")} className="hidden shrink-0 items-center gap-1 text-xs font-semibold sm:inline-flex">
        Voir plus <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={dismiss} aria-label="Fermer l'annonce" className="shrink-0 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

const QUICK_ACTIONS = [
  { view: "users", label: "Gérer les utilisateurs", icon: Users },
  { view: "talents", label: "Gérer les talents", icon: UserCog },
  { view: "requests", label: "Voir les demandes", icon: FileText },
  { view: "payments", label: "Gérer les paiements", icon: WalletCards },
  { view: "announcements", label: "Créer une annonce", icon: Megaphone },
]

export default function AdminDashboardView({ onNavigate }) {
  const { data, isLoading, isFetching, error, refetch } = useAdminOverviewQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement du tableau de bord…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="flex flex-col gap-3 p-5 text-sm text-red-700 dark:text-red-300">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error?.message || "Impossible de charger le tableau de bord."}
          </span>
          <Button variant="outline" className="w-fit gap-2" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" /> Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  const t = data.totals || {}
  const p = data.previous || {}
  const series = data.series || []

  const kpis = [
    { icon: Users, label: "Utilisateurs totaux", value: formatNumber(t.users), delta: growth(t.users, p.users) },
    { icon: UserCog, label: "Managers", value: formatNumber(t.managers), delta: growth(t.managers, p.managers) },
    { icon: UserCheck, label: "Clients", value: formatNumber(t.clients), delta: growth(t.clients, p.clients) },
    { icon: Star, label: "Talents", value: formatNumber(t.talents), delta: growth(t.talents, p.talents) },
    {
      icon: FolderKanban,
      label: "Projets actifs",
      value: formatNumber(t.active_projects),
      delta: growth(p.projects_new_month, p.projects_new_prev),
      hint: "nouveaux projets vs mois dernier",
    },
    {
      icon: CreditCard,
      label: "Paiements ce mois",
      value: `${formatNumber(t.payments_month)} ${t.payments_currency || "FCFA"}`,
      delta: growth(t.payments_month, p.payments_prev_month),
    },
  ]

  const roleSlices = [
    { name: "Clients", value: Number(t.clients || 0), color: GOLD },
    { name: "Managers", value: Number(t.managers || 0), color: BLUE },
    { name: "Admins", value: Number(t.admins || 0), color: GRAY },
  ]
  const usersTotal = Number(t.users || 0)
  const pct = (v) => (usersTotal > 0 ? ((v / usersTotal) * 100).toFixed(1).replace(".", ",") : "0")
  const hasRoles = roleSlices.some((s) => s.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">👋</span>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme KORA</p>
          </div>
        </div>
        <div className="xl:max-w-xl xl:flex-1">
          <AnnouncementBanner onNavigate={onNavigate} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Panel
          title="Évolution des utilisateurs"
          icon={Users}
          className="xl:col-span-6"
          action={
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: GOLD }} />Clients</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: BLUE }} />Managers</span>
            </div>
          }
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gManagers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="clients" name="Clients" stroke={GOLD} strokeWidth={2} fill="url(#gClients)" dot={{ r: 3 }} />
                <Area type="monotone" dataKey="managers" name="Managers" stroke={BLUE} strokeWidth={2} fill="url(#gManagers)" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Répartition des rôles" icon={ShieldCheck} className="xl:col-span-3">
          {hasRoles ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-[170px] w-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleSlices} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2} stroke="none">
                      {roleSlices.map((s) => <Cell key={s.name} fill={s.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black">{formatNumber(usersTotal)}</span>
                  <span className="text-[11px] text-muted-foreground">utilisateurs</span>
                </div>
              </div>
              <ul className="w-full space-y-1.5 text-sm">
                {roleSlices.map((s) => (
                  <li key={s.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1">{s.name}</span>
                    <span className="tabular-nums text-muted-foreground">{formatNumber(s.value)} ({pct(s.value)}%)</span>
                  </li>
                ))}
                <li className="flex items-center gap-2 border-t border-border pt-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: VIOLET }} />
                  <span className="flex-1">Talents (profils gérés)</span>
                  <span className="tabular-nums text-muted-foreground">{formatNumber(t.talents)}</span>
                </li>
              </ul>
            </div>
          ) : (
            <Empty>Aucun utilisateur.</Empty>
          )}
        </Panel>

        <Panel title="Actions rapides" className="xl:col-span-3">
          <div className="space-y-2.5">
            {QUICK_ACTIONS.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                type="button"
                onClick={() => onNavigate(view)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm font-medium transition-colors hover:border-gold/50 hover:bg-accent/40"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Derniers utilisateurs inscrits" icon={Users} action={<SeeAll onClick={() => onNavigate("users")} />}>
          {(data.recent_users || []).length === 0 ? (
            <Empty>Aucun utilisateur.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Nom</th><th className="pb-2 font-medium">Rôle</th>
                    <th className="pb-2 font-medium">Inscription</th><th className="pb-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recent_users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-2"><span className="flex items-center gap-2"><Avatar name={u.name} src={u.avatar} /><span className="truncate">{u.name || "—"}</span></span></td>
                      <td className="py-2.5 pr-2"><Pill tone={ROLE_STYLES[u.role] || TONES.muted}>{ROLE_LABELS[u.role] || u.role}</Pill></td>
                      <td className="whitespace-nowrap py-2.5 pr-2 text-xs text-muted-foreground">{formatDateTime(u.created_at)}</td>
                      <td className="py-2.5"><Pill tone={u.is_suspended ? TONES.bad : TONES.ok}>{u.is_suspended ? "Suspendu" : "Actif"}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Demandes récentes" icon={ClipboardList} action={<SeeAll onClick={() => onNavigate("requests")} />}>
          {(data.recent_requests || []).length === 0 ? (
            <Empty>Aucune demande.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Client</th><th className="pb-2 font-medium">Talent</th>
                    <th className="pb-2 font-medium">Statut</th><th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recent_requests.map((r) => {
                    const [label, tone] = REQUEST_STATUS[r.status] || [r.status, "muted"]
                    return (
                      <tr key={r.id}>
                        <td className="py-2.5 pr-2"><span className="flex items-center gap-2"><Avatar name={r.client_name} /><span className="truncate">{r.client_name}</span></span></td>
                        <td className="py-2.5 pr-2"><span className="truncate">{r.talent_name}</span></td>
                        <td className="py-2.5 pr-2"><Pill tone={TONES[tone]}>{label}</Pill></td>
                        <td className="whitespace-nowrap py-2.5 text-xs text-muted-foreground">{formatDate(r.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Paiements récents" icon={WalletCards} action={<SeeAll onClick={() => onNavigate("payments")} />}>
          {(data.recent_payments || []).length === 0 ? (
            <Empty>Aucun paiement.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Utilisateur</th><th className="pb-2 font-medium">Montant</th>
                    <th className="pb-2 font-medium">Statut</th><th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recent_payments.map((pay) => {
                    const [label, tone] = PAYMENT_STATUS[pay.status] || [pay.status, "muted"]
                    return (
                      <tr key={pay.id}>
                        <td className="py-2.5 pr-2"><span className="flex items-center gap-2"><Avatar name={pay.payer_name} /><span className="truncate">{pay.payer_name}</span></span></td>
                        <td className="whitespace-nowrap py-2.5 pr-2">{formatNumber(pay.amount)} {pay.currency === "XOF" || !pay.currency ? "FCFA" : pay.currency}</td>
                        <td className="py-2.5 pr-2"><Pill tone={TONES[tone]}>{label}</Pill></td>
                        <td className="whitespace-nowrap py-2.5 text-xs text-muted-foreground">{formatDate(pay.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} KORA. Tous droits réservés.</span>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-1.5 hover:text-foreground">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Actualiser
        </button>
      </div>
    </div>
  )
}
