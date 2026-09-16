// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Search, Plus, MoreHorizontal, Clock, CheckCircle2, XCircle,
  ChevronRight, Users, Download, MessageCircle, Eye, RefreshCw, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"

// Statuts supportés en base (anglais) avec repli sur d'éventuelles valeurs
// françaises historiques, pour ne jamais afficher un statut "cassé".
const STATUS = {
  pending: { label: "À traiter", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock, dot: "bg-amber-500" },
  en_attente: { label: "À traiter", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock, dot: "bg-amber-500" },
  accepted: { label: "Acceptée", cls: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Users, dot: "bg-blue-500" },
  acceptee: { label: "Acceptée", cls: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Users, dot: "bg-blue-500" },
  in_progress: { label: "En cours", cls: "bg-violet-500/10 text-violet-600 border-violet-500/30", icon: Eye, dot: "bg-violet-500" },
  en_cours: { label: "En cours", cls: "bg-violet-500/10 text-violet-600 border-violet-500/30", icon: Eye, dot: "bg-violet-500" },
  completed: { label: "Terminé", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle2, dot: "bg-emerald-500" },
  terminee: { label: "Terminé", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle2, dot: "bg-emerald-500" },
  rejected: { label: "Refusée", cls: "bg-red-500/10 text-red-600 border-red-500/30", icon: XCircle, dot: "bg-red-500" },
  refusee: { label: "Refusée", cls: "bg-red-500/10 text-red-600 border-red-500/30", icon: XCircle, dot: "bg-red-500" },
}

const DEFAULT_STATUS = { label: "Inconnu", cls: "bg-muted text-muted-foreground border-border", icon: Clock, dot: "bg-muted-foreground" }

function getClientName(client) {
  if (!client) return "Client"
  return client.name || [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client"
}

function getTalentName(talent) {
  if (!talent) return "Talent non assigné"
  return talent.name || [talent.first_name, talent.last_name].filter(Boolean).join(" ") || "Talent"
}

function initialsFrom(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?"
}

export default function ManagerRequests() {
  const { user, isLoading: authLoading } = useAuth()

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (authLoading) return
    if (!user?.authId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadRequests() {
      setLoading(true)
      setError("")

      try {
        const { data: rows, error: requestsError } = await supabase
          .from("requests")
          .select("*")
          .eq("manager_id", user.authId)
          .order("created_at", { ascending: false })

        if (requestsError) throw requestsError

        const list = rows || []
        const clientIds = [...new Set(list.map((r) => r.client_id).filter(Boolean))]
        const talentIds = [...new Set(list.map((r) => r.talent_id).filter(Boolean))]

        const [clientsResult, talentsResult] = await Promise.all([
          clientIds.length
            ? supabase.from("profiles").select("id, first_name, last_name, name").in("id", clientIds)
            : Promise.resolve({ data: [], error: null }),
          talentIds.length
            ? supabase.from("talent_profiles").select("id, first_name, last_name, title").in("id", talentIds)
            : Promise.resolve({ data: [], error: null }),
        ])

        if (clientsResult.error) throw clientsResult.error
        if (talentsResult.error) throw talentsResult.error

        const clientsById = new Map((clientsResult.data || []).map((c) => [c.id, c]))
        const talentsById = new Map((talentsResult.data || []).map((t) => [t.id, t]))

        if (cancelled) return

        setRequests(
          list.map((r) => ({
            ...r,
            client: clientsById.get(r.client_id) || null,
            talent: talentsById.get(r.talent_id) || null,
          }))
        )
      } catch (err) {
        console.error("Erreur chargement des requêtes manager :", err)
        if (!cancelled) {
          setError(err?.message || "Impossible de charger les projets et requêtes.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRequests()

    return () => {
      cancelled = true
    }
  }, [authLoading, user?.authId])

  const rows = useMemo(() => {
    const query = q.toLowerCase()
    return requests.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      const matchesQuery =
        !query ||
        (r.title || "").toLowerCase().includes(query) ||
        getClientName(r.client).toLowerCase().includes(query) ||
        getTalentName(r.talent).toLowerCase().includes(query)
      return matchesStatus && matchesQuery
    })
  }, [requests, q, statusFilter])

  const counts = useMemo(() => {
    const c = { all: requests.length, pending: 0, in_progress: 0, review: 0, completed: 0 }
    for (const r of requests) {
      if (r.status === "pending" || r.status === "en_attente") c.pending++
      else if (r.status === "in_progress" || r.status === "en_cours") c.in_progress++
      else if (r.status === "accepted" || r.status === "acceptee") c.review++
      else if (r.status === "completed" || r.status === "terminee") c.completed++
    }
    return c
  }, [requests])

  const totalBudget = useMemo(
    () => requests.reduce((a, r) => a + (Number(r.budget) || 0), 0),
    [requests]
  )

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement des projets...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Projets & requêtes</h1>
          <p className="text-sm text-muted-foreground">
            {requests.length} projet{requests.length > 1 ? "s" : ""} · {formatCurrency(totalBudget)} engagés
          </p>
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

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "À traiter", val: counts.pending, icon: Clock, cls: "text-amber-600" },
          { label: "Acceptées", val: counts.review, icon: Users, cls: "text-blue-600" },
          { label: "En cours", val: counts.in_progress, icon: Eye, cls: "text-violet-600" },
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
              {[
                { k: "all", l: "Tous" },
                { k: "pending", l: `À faire ${counts.pending}` },
                { k: "accepted", l: `Acceptées ${counts.review}` },
                { k: "in_progress", l: `En cours ${counts.in_progress}` },
                { k: "completed", l: `Terminés ${counts.completed}` },
              ].map((f) => (
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
              const s = STATUS[r.status] || DEFAULT_STATUS
              const SIcon = s.icon
              const clientName = getClientName(r.client)
              const talentName = getTalentName(r.talent)
              const initials = initialsFrom(clientName)
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
                          <h3 className="font-black truncate group-hover:gold-text-gradient transition-colors">
                            {r.title || "Projet sans titre"}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2.5 truncate">
                          <span className="font-semibold text-foreground">{clientName}</span> · Talent assigné : {talentName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                          <Badge variant="outline" className={cn("gap-1 font-bold", s.cls)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                            <SIcon className="h-3 w-3" /> {s.label}
                          </Badge>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatDate(r.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Separator className="md:hidden" />
                    <div className="flex md:flex-col md:items-end items-center gap-3 md:gap-2 shrink-0 w-full md:w-auto justify-between">
                      <div className="md:text-right">
                        <p className="text-xl font-black gold-text-gradient tracking-tight">
                          {formatCurrency(r.budget, r.currency || "XOF")}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Budget</p>
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
                <p className="text-sm text-muted-foreground">
                  {requests.length === 0 ? "Aucun projet pour le moment." : "Aucun projet ne correspond à votre recherche."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}