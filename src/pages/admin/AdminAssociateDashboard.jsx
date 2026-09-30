import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Users,
  UserCheck,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

const MODULES = [
  ["users.read", "Utilisateurs", Users],
  ["managers.read", "Managers", UserCheck],
  ["talents.read", "Talents", ShieldCheck],
  ["requests.read", "Demandes", ClipboardList],
  ["projects.read", "Projets", BriefcaseBusiness],
  ["messages.read", "Messages", MessageCircle],
  ["moderation.read", "Modération", ShieldCheck],
]

export default function AdminAssociateDashboard() {
  const navigate = useNavigate()
  const [access, setAccess] = useState(null)
  const [stats, setStats] = useState({ users: 0, requests: 0, unread: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError("")

      const [{ data: accessData, error: accessError }, users, requests, messages] =
        await Promise.all([
          supabase.rpc("get_my_admin_access"),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("requests").select("id", { count: "exact", head: true }),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .is("read_at", null),
        ])

      if (!mounted) return

      if (accessError) {
        setError(accessError.message)
        setLoading(false)
        return
      }

      setAccess(accessData)
      setStats({
        users: users.count || 0,
        requests: requests.count || 0,
        unread: messages.count || 0,
      })
      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const permissions = access?.permissions || {}
  const allowedModules = useMemo(
    () => MODULES.filter(([permission]) => permissions["*"] || permissions[permission]),
    [permissions]
  )

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement de votre espace administrateur…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  const level = access?.access_level === "super_admin" ? "Super Admin" : "Admin associé"

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold font-semibold">Administration KORA</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Espace {level}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Cet espace est séparé du tableau de bord CEO. Les modules affichés correspondent aux permissions accordées à votre compte.
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Accès contrôlé
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Utilisateurs accessibles</p>
            <p className="mt-2 text-3xl font-black">{stats.users}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Demandes</p>
            <p className="mt-2 text-3xl font-black">{stats.requests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Messages non lus</p>
            <p className="mt-2 text-3xl font-black">{stats.unread}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fonctionnalités autorisées
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allowedModules.length ? (
            allowedModules.map(([permission, label, Icon]) => (
              <button
                key={permission}
                type="button"
                onClick={() => {
                  const view = permission.split(".")[0]
                  const map = {
                    users: "users",
                    managers: "managers",
                    talents: "talents",
                    requests: "requests",
                    projects: "projects",
                    messages: "messages",
                    moderation: "moderation",
                  }
                  if (map[view]) navigate(`/admin?view=${map[view]}`)
                }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-left transition hover:border-gold/40 hover:bg-accent"
              >
                <Icon className="h-5 w-5 text-gold" />
                <div className="min-w-0">
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">Accès autorisé</p>
                </div>
              </button>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Aucune fonctionnalité n’est actuellement attribuée à ce compte.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limites et durée d'accès</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Utilisateurs max.</p>
            <p className="mt-1 font-bold">{access?.max_users ?? "Illimité"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Validations de paiement</p>
            <p className="mt-1 font-bold">{access?.max_payment_validations ?? "Illimité"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expiration</p>
            <p className="mt-1 font-bold">
              {access?.access_expires_at
                ? new Date(access.access_expires_at).toLocaleDateString("fr-FR")
                : "Aucune"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Bell className="h-4 w-4" />
        Les permissions sont définies par le Super Admin et ne peuvent pas être modifiées depuis cet espace.
      </div>
    </div>
  )
}
