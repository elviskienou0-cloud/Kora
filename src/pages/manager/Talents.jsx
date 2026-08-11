// @ts-nocheck
import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Search, Filter, Plus, MoreHorizontal, ChevronRight, Star,
  Mail, ShieldCheck, UserPlus, Award, UserCheck, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const TALENTS = [
  { id: "t1", name: "Aïcha Sow", cat: "Design UI/UX", tasks: 14, rating: 4.9, status: "approved", rate: "30k/h", since: "Mars 2025" },
  { id: "t2", name: "Moussa Keïta", cat: "Développement Web", tasks: 9, rating: 4.8, status: "approved", rate: "42k/h", since: "Fév 2025" },
  { id: "t3", name: "Nora Bennani", cat: "Rédaction & SEO", tasks: 5, rating: 5.0, status: "approved", rate: "18k/h", since: "Mars 2025" },
  { id: "t4", name: "Sadio Touré", cat: "Marketing Digital", tasks: 11, rating: 4.7, status: "approved", rate: "35k/h", since: "Jan 2025" },
  { id: "t5", name: "Yannick Kouassi", cat: "Montage Vidéo", tasks: 2, rating: 4.5, status: "pending", rate: "28k/h", since: "Aujourd'hui" },
  { id: "t6", name: "Binta Diagne", cat: "Illustration", tasks: 0, rating: 0, status: "pending", rate: "22k/h", since: "Hier" },
  { id: "t7", name: "Jamel Benali", cat: "Développement Mobile", tasks: 3, rating: 4.6, status: "approved", rate: "48k/h", since: "Déc 2024" },
]

const STATUS = {
  approved: { label: "Approuvé", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: UserCheck },
  pending: { label: "En attente", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock },
}

export default function ManagerTalents() {
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState("all")
  const rows = TALENTS.filter((t) =>
    (filter === "all" || t.status === filter) &&
    (t.name.toLowerCase().includes(q.toLowerCase()) || t.cat.toLowerCase().includes(q.toLowerCase()))
  )

  const approve = (t) => {
    toast.success(`${t.name} a bien été approuvé ✅`)
  }

  const pendingCount = TALENTS.filter((t) => t.status === "pending").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Gestion des talents</h1>
          <p className="text-sm text-muted-foreground">{TALENTS.length} talents dans votre équipe · {pendingCount} en attente</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter un talent
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: TALENTS.length, cls: "text-gold-dark", icon: Award },
          { label: "Approuvés", value: TALENTS.filter((t) => t.status === "approved").length, cls: "text-emerald-600", icon: ShieldCheck },
          { label: "En attente", value: pendingCount, cls: "text-amber-600", icon: Clock },
          { label: "Note moy.", value: (TALENTS.filter((t) => t.rating).reduce((a, b) => a + b.rating, 0) / TALENTS.filter((t) => t.rating).length).toFixed(1), cls: "text-violet-600", icon: Star },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-current/10 to-current/5 shrink-0", s.cls)}>
                  <Icon className={cn("h-5 w-5", s.cls)} />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">{s.value}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
          <div>
            <CardTitle className="font-black">Cohorte</CardTitle>
            <CardDescription className="text-sm">Acceptez ou refusez les nouvelles recrues</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-full sm:w-auto">
              {[{ k: "all", l: "Tous" }, { k: "pending", l: `En attente (${pendingCount})` }, { k: "approved", l: "Approuvés" }].map((f) => (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k)}
                  className={cn(
                    "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                    filter === f.k ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left">
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Talent</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Catégorie</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Rejoint</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Perf.</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const s = STATUS[t.status] || STATUS.pending
                  const StatusIcon = s.icon
                  const initials = t.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b border-border/40 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="gold-gradient text-white text-xs font-black">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold truncate">{t.name}</p>
                            <p className="text-xs text-muted-foreground truncate md:hidden">{t.cat}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 hidden md:table-cell">
                        <span className="text-xs font-medium">{t.cat}</span>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{t.since}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge variant="outline" className={cn("gap-1 font-bold text-xs", s.cls)}>
                          <StatusIcon className="h-3 w-3" /> {s.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 hidden sm:table-cell">
                        <div className="flex items-center gap-3 text-xs">
                          {t.rating ? (
                            <span className="flex items-center gap-1 font-bold">
                              <Star className="h-3.5 w-3.5 text-gold fill-gold" /> {t.rating}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                          <span className="text-muted-foreground">{t.tasks} tâches</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          {t.status === "pending" && (
                            <>
                              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs px-2.5" onClick={() => approve(t)}>
                                <ShieldCheck className="h-3.5 w-3.5" /> Approuver
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 hover:text-red-600 hover:bg-red-500/10" onClick={() => toast.info(`Refus de ${t.name}`)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-sm text-muted-foreground">Aucun talent trouvé.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gold/20 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-md shadow-gold/25 shrink-0">
            <UserPlus className="h-7 w-7 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-lg mb-1">Inviter des talents par email</h3>
            <p className="text-sm text-muted-foreground">Invitez des talents en masse ou par email personnalisé. 3 invitations Premium restantes.</p>
          </div>
          <Button className="gap-2 shrink-0">
            <ChevronRight className="h-4 w-4" /> Inviter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
