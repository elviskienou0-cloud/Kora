import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Users, Briefcase, Star, Clock, TrendingUp, ChevronRight,
  Award, Sparkles, DollarSign, Bell, Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import WeeklyChart from "@/components/WeeklyChart"

const STATS = [
  { label: "Talents managés", value: "24", delta: "+3", icon: Users, color: "from-violet-400/20 to-violet-500/10 text-violet-600" },
  { label: "Projets en cours", value: "7", delta: "+1", icon: Briefcase, color: "from-blue-400/20 to-blue-500/10 text-blue-600" },
  { label: "Revenus générés", value: "4.8M", delta: "+18%", icon: DollarSign, color: "from-emerald-400/20 to-emerald-500/10 text-emerald-600" },
  { label: "Satisfaction client", value: "4.9/5", delta: "+0.2", icon: Star, color: "from-gold/20 to-amber-500/10 text-gold-dark" },
]

const TALENTS = [
  { id: "t1", name: "Aïcha Sow", cat: "Design UI/UX", tasks: 14, rating: 4.9, status: "busy", rate: "30k/h" },
  { id: "t2", name: "Moussa Keïta", cat: "Développement Web", tasks: 9, rating: 4.8, status: "available", rate: "42k/h" },
  { id: "t3", name: "Nora Bennani", cat: "Rédaction & SEO", tasks: 5, rating: 5.0, status: "available", rate: "18k/h" },
  { id: "t4", name: "Sadio Touré", cat: "Marketing Digital", tasks: 11, rating: 4.7, status: "busy", rate: "35k/h" },
]

const STATUS = {
  available: { label: "Disponible", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  busy: { label: "Occupé", cls: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
}

const NOTIFICATIONS = [
  { id: 1, text: "Aïcha a soumis une nouvelle livraison", time: "Il y a 1h", icon: Sparkles },
  { id: 2, text: "Paiement reçu - Projet Branding VI", time: "Il y a 3h", icon: DollarSign },
  { id: 3, text: "Nouveau talent à approuver (5 candidats)", time: "Il y a 5h", icon: Users },
]

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground">Pilotez votre équipe de talents efficacement</p>
        </div>
        <Button className="gap-2">
          <Award className="h-4 w-4" /> Inviter un talent
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {STATS.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="h-full border-border/60 hover:border-gold/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center", s.color)}>
                      <Icon className="h-5.5 w-5.5" strokeWidth={2.2} />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-bold">{s.delta}</Badge>
                  </div>
                  <p className="text-2xl font-black tracking-tight mb-1">{s.value}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
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
              <CardTitle className="font-black">Productivité de l'équipe</CardTitle>
              <CardDescription className="text-sm">Tâches complétées / jour</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <WeeklyChart
              title=""
              subtitle=""
              data={[
                { day: "Lun", value: 22 },
                { day: "Mar", value: 28 },
                { day: "Mer", value: 35 },
                { day: "Jeu", value: 30 },
                { day: "Ven", value: 38 },
                { day: "Sam", value: 14 },
                { day: "Dim", value: 9 },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-black">Activité</CardTitle>
            <Badge variant="outline" className="gap-1 text-xs font-bold bg-gold/10 text-gold-dark border-gold/30">
              <Bell className="h-3 w-3" /> {NOTIFICATIONS.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {NOTIFICATIONS.map((n) => {
              const Icon = n.icon
              return (
                <div key={n.id} className="flex gap-3 p-3 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => toast.success("Notification ouverte")}>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold/15 to-amber-400/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-gold-dark" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{n.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
              )
            })}
            <Separator />
            <Button variant="ghost" className="w-full text-xs font-bold text-muted-foreground hover:text-foreground">
              Voir toutes les notifications →
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
          <div>
            <CardTitle className="font-black">Mes talents</CardTitle>
            <CardDescription className="text-sm">Équipe active et disponibilités</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Chercher un talent..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-6">
              {TALENTS.map((t) => {
                const s = STATUS[t.status] || STATUS.busy
                const initials = t.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()
                return (
                  <div key={t.id} className="group rounded-2xl border border-border/60 bg-card p-5 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                        <AvatarFallback className="gold-gradient text-white font-black">{initials}</AvatarFallback>
                      </Avatar>
                      <Badge variant="outline" className={cn("text-[10px] font-bold", s.cls)}>{s.label}</Badge>
                    </div>
                    <h3 className="font-black mb-0.5 group-hover:gold-text-gradient transition-colors truncate">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{t.cat}</p>
                    <div className="grid grid-cols-3 gap-1 py-3 border-y border-border/50 mb-3 text-center">
                      <div>
                        <p className="font-black text-sm">{t.tasks}</p>
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">Tâches</p>
                      </div>
                      <div>
                        <p className="font-black text-sm flex items-center justify-center gap-0.5"><Star className="h-3 w-3 text-gold fill-gold" />{t.rating}</p>
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">Note</p>
                      </div>
                      <div>
                        <p className="font-black text-sm">{t.rate}</p>
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">Tarif</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full gap-1.5 text-xs font-bold">
                      Voir profil <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
