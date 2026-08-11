// @ts-nocheck
import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Search, Plus, MoreHorizontal, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Users, Filter, Download, MessageCircle, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const REQUESTS = [
  { id: "r1", title: "Branding complet startup AgriTech", client: "AgriTech SA", talents: 3, budget: "1.8M XOF", status: "in_progress", due: "Il y a 3 jours", priority: "high" },
  { id: "r2", title: "Site e-commerce mode Sénégalaise", client: "SunuWax", talents: 2, budget: "950k XOF", status: "pending", due: "Il y a 1 jour", priority: "med" },
  { id: "r3", title: "Campagne réseaux Ramadan", client: "Foodies Dakar", talents: 2, budget: "480k XOF", status: "review", due: "Aujourd'hui", priority: "high" },
  { id: "r4", title: "Refonte identité visuelle", client: "FinTrust Bank", talents: 4, budget: "3.2M XOF", status: "completed", due: "Il y a 1 semaine", priority: "low" },
  { id: "r5", title: "Application livraison MVP", client: "Jablo", talents: 5, budget: "5.5M XOF", status: "in_progress", due: "Il y a 5 jours", priority: "med" },
  { id: "r6", title: "Packshot produit cosmétique", client: "Nile Beauty", talents: 1, budget: "320k XOF", status: "pending", due: "Il y a 2 jours", priority: "low" },
]

const STATUS = {
  pending: { label: "À traiter", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock, dot: "bg-amber-500" },
  in_progress: { label: "En cours", cls: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Users, dot: "bg-blue-500" },
  review: { label: "En revue", cls: "bg-violet-500/10 text-violet-600 border-violet-500/30", icon: Eye, dot: "bg-violet-500" },
  completed: { label: "Terminé", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle2, dot: "bg-emerald-500" },
}

const PRIORITY = {
  high: { label: "Haute", cls: "text-red-600 bg-red-500/10 border-red-500/30" },
  med: { label: "Moyenne", cls: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
  low: { label: "Basse", cls: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
}

export default function ManagerRequests() {
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const rows = REQUESTS.filter((r) =>
    (statusFilter === "all" || r.status === statusFilter) &&
    (r.title.toLowerCase().includes(q.toLowerCase()) || r.client.toLowerCase().includes(q.toLowerCase()))
  )

  const counts = {
    all: REQUESTS.length,
    pending: REQUESTS.filter((r) => r.status === "pending").length,
    in_progress: REQUESTS.filter((r) => r.status === "in_progress").length,
    review: REQUESTS.filter((r) => r.status === "review").length,
    completed: REQUESTS.filter((r) => r.status === "completed").length,
  }

  const totalBudget = REQUESTS.reduce((a, r) => a + parseInt(r.budget.replace(/[^\d]/g, "") || "0", 10), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Projets & requêtes</h1>
          <p className="text-sm text-muted-foreground">{REQUESTS.length} projets · {totalBudget.toLocaleString("fr-FR")} XOF engagés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exporter
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nouveau projet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "À traiter", val: counts.pending, icon: Clock, cls: "text-amber-600" },
          { label: "En cours", val: counts.in_progress, icon: Users, cls: "text-blue-600" },
          { label: "En revue", val: counts.review, icon: Eye, cls: "text-violet-600" },
          { label: "Terminés", val: counts.completed, icon: CheckCircle2, cls: "text-emerald-600" },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-current/10 to-current/5 shrink-0", s.cls)}>
                  <Icon className={cn("h-5 w-5", s.cls)} />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">{s.val}</p>
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
            <CardTitle className="font-black">Tous les projets</CardTitle>
            <CardDescription className="text-sm">Pilotez les livrables et jalons</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un projet..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl overflow-x-auto">
              {[{ k: "all", l: "Tous" }, { k: "pending", l: `À faire ${counts.pending}` }, { k: "in_progress", l: `En cours ${counts.in_progress}` }, { k: "review", l: `Revue ${counts.review}` }, { k: "completed", l: `Terminés ${counts.completed}` }].map((f) => (
                <button
                  key={f.k}
                  onClick={() => setStatusFilter(f.k)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                    statusFilter === f.k ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {rows.map((r, i) => {
              const s = STATUS[r.status] || STATUS.pending
              const SIcon = s.icon
              const p = PRIORITY[r.priority] || PRIORITY.med
              const initials = r.client.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase()
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group rounded-2xl border border-border/60 bg-card hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 transition-all p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Avatar className="h-11 w-11 shrink-0 shadow-sm border-2 border-background">
                        <AvatarFallback className="gold-gradient text-white text-sm font-black">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-black truncate group-hover:gold-text-gradient transition-colors">{r.title}</h3>
                          <Badge variant="outline" className={cn("gap-1 text-[10px] font-bold", p.cls)}>
                            <AlertTriangle className="h-2.5 w-2.5" /> {p.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2.5 truncate">
                          <span className="font-semibold text-foreground">{r.client}</span> · {r.talents} talent{r.talents > 1 ? "s" : ""} assigné{r.talents > 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                          <Badge variant="outline" className={cn("gap-1 font-bold", s.cls)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                            <SIcon className="h-3 w-3" /> {s.label}
                          </Badge>
                          <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {r.due}</span>
                        </div>
                      </div>
                    </div>
                    <Separator className="md:hidden" />
                    <div className="flex md:flex-col md:items-end items-center gap-3 md:gap-2 shrink-0 w-full md:w-auto justify-between">
                      <div className="md:text-right">
                        <p className="text-xl font-black gold-text-gradient tracking-tight">{r.budget}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Budget total</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => toast.info("Conversation ouverte")}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-lg" onClick={() => toast.success("Détails du projet")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <Button className="rounded-xl gap-1.5">
                          Gérer <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {rows.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-sm text-muted-foreground">Aucun projet ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
