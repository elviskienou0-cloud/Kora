// @ts-nocheck
import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Users, TrendingUp, Sparkles, ShieldCheck, DollarSign, Clock,
  Eye, MoreHorizontal, Search, Filter, Download, ChevronRight,
  UserCog, Settings, AlertTriangle, CheckCircle2, BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { APP_PARAMS } from "@/lib/app-params"
import WeeklyChart from "@/components/WeeklyChart"

const STATS = [
  { label: "Utilisateurs", value: "12 847", delta: "+12.4%", icon: Users, color: "from-blue-400/20 to-blue-500/10 text-blue-600", trend: "up" },
  { label: "Talents actifs", value: "3 412", delta: "+8.1%", icon: Sparkles, color: "from-gold/20 to-amber-500/10 text-gold-dark", trend: "up" },
  { label: "Projets", value: "1 083", delta: "+15.2%", icon: BarChart3, color: "from-violet-400/20 to-violet-500/10 text-violet-600", trend: "up" },
  { label: "Revenus plateforme", value: "85.2M", delta: "+21.7%", icon: DollarSign, color: "from-emerald-400/20 to-emerald-500/10 text-emerald-600", trend: "up" },
  { label: "Taux de résolution", value: "98.3%", delta: "+1.1%", icon: CheckCircle2, color: "from-emerald-500/20 to-emerald-500/10 text-emerald-700", trend: "up" },
  { label: "Signaux modération", value: "47", delta: "-5.3%", icon: AlertTriangle, color: "from-orange-400/20 to-orange-500/10 text-orange-600", trend: "down" },
]

const RECENT = [
  { id: "u_1", name: "Fatou Ndiaye", email: "fatou@exemple.sn", role: "Talent", status: "verified", joined: "Il y a 2h" },
  { id: "u_2", name: "Tech Corp Africa", email: "hello@techcorp.africa", role: "Client", status: "verified", joined: "Il y a 4h" },
  { id: "u_3", name: "Kofi Mensah", email: "kofi@demo.gh", role: "Talent", status: "pending", joined: "Il y a 6h" },
  { id: "u_4", name: "Marie Kamau", email: "marie@startup.ke", role: "Manager", status: "verified", joined: "Il y a 1j" },
  { id: "u_5", name: "Aliou Traoré", email: "aliou@projet.ml", role: "Client", status: "flagged", joined: "Il y a 1j" },
]

const STATUS = {
  verified: { label: "Vérifié", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
  pending: { label: "En attente", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock },
  flagged: { label: "Signalé", cls: "bg-red-500/10 text-red-600 border-red-500/30", icon: AlertTriangle },
}

export default function AdminPanel() {
  const [q, setQ] = useState("")
  const filtered = RECENT.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Panneau d'administration</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme {APP_PARAMS?.name || "KORA"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exporter CSV
          </Button>
          <Button className="gap-2">
            <Settings className="h-4 w-4" /> Paramètres
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {STATS.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="h-full border-border/60 hover:border-gold/30 transition-colors overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm", s.color)}>
                      <Icon className="h-6 w-6" strokeWidth={2.2} />
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold px-2",
                      s.trend === "up" ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                                        : "text-orange-600 border-orange-500/30 bg-orange-500/10"
                    )}>
                      {s.delta}
                    </Badge>
                  </div>
                  <p className="text-3xl font-black tracking-tight mb-1">{s.value}</p>
                  <p className="text-sm font-semibold text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-black">Activité hebdo</CardTitle>
              <CardDescription className="text-sm">7 derniers jours</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-3.5 w-3.5" /> Filtrer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <WeeklyChart
              title=""
              subtitle=""
              data={[
                { day: "Lun", value: 42 },
                { day: "Mar", value: 58 },
                { day: "Mer", value: 71 },
                { day: "Jeu", value: 63 },
                { day: "Ven", value: 84 },
                { day: "Sam", value: 49 },
                { day: "Dim", value: 38 },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-black">Actions rapides</CardTitle>
            <CardDescription className="text-sm">Outils d'administration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { icon: UserCog, label: "Gérer les utilisateurs", desc: "Tous les comptes plateforme" },
              { icon: ShieldCheck, label: "Vérifications en attente", desc: "17 demandes à examiner" },
              { icon: AlertTriangle, label: "Modération", desc: "47 signalements actifs" },
              { icon: DollarSign, label: "Paiements & retraits", desc: "Compta & transactions" },
            ].map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.label}
                  className="w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 text-left hover:border-gold/40 hover:bg-gold/5 transition-all group"
                  onClick={() => toast.info("Bientôt disponible", { description: a.label })}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-gold-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm group-hover:gold-text-gradient transition-colors">{a.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
          <div>
            <CardTitle className="font-black">Utilisateurs récents</CardTitle>
            <CardDescription className="text-sm">Nouveaux inscrits et activités</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left">
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Utilisateur</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Rôle</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Inscription</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const status = STATUS[u.status] || STATUS.pending
                  const StatusIcon = status.icon
                  const initials = u.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
                  return (
                    <tr key={u.id} className="border-b border-border/40 hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="gold-gradient text-white text-xs font-black">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 hidden md:table-cell">
                        <Badge variant="outline" className="font-semibold text-xs">{u.role}</Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant="outline" className={cn("gap-1 font-bold text-xs", status.cls)}>
                          <StatusIcon className="h-3 w-3" /> {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground font-medium">{u.joined}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <Button variant="ghost" size="icon" className="rounded-lg -mr-2" onClick={() => toast.success("Menu d'actions à venir")}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
