import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Crown,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Star,
  Users,
  UserCog,
  UserPlus,
  Settings,
  Database,
  Globe2,
  CreditCard,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"


const formatNumber = (value) =>
  new Intl.NumberFormat("fr-FR").format(Number(value || 0))


const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
}) => {
  return (
    <Card className="border-border/70 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>

            <p className="text-3xl font-black tracking-tight mt-2">
              {value}
            </p>

            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>

          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


const QuickAction = ({
  icon: Icon,
  title,
  description,
  href,
}) => {
  return (
    <Link
      to={href}
      className="group block rounded-xl border border-border/70 p-4 hover:border-primary/40 hover:bg-muted/40 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Icon className="h-5 w-5 group-hover:text-primary transition-colors" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">
            {title}
          </p>

          <p className="text-xs text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>

        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}


export default function SuperAdminPanel() {
  const { user, logout } = useAuth()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [stats, setStats] = useState({
    users: 0,
    managers: 0,
    clients: 0,
    admins: 0,
    talents: 0,
    projects: 0,
    publishedTalents: 0,
    activeSubscriptions: 0,
  })

  const [admins, setAdmins] = useState([])

  const loadDashboard = async () => {
    try {
      setRefreshing(true)

      const [
        usersResult,
        managersResult,
        clientsResult,
        adminsResult,
        talentsResult,
        publishedTalentsResult,
        projectsResult,
        subscriptionsResult,
        adminProfilesResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "manager"),

        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "client"),

        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin"),

        supabase
          .from("talent_profiles")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("talent_profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .eq("is_visible", true),

        supabase
          .from("projects")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),

        supabase
          .from("profiles")
          .select("id, name, role, avatar, created_at")
          .eq("role", "admin")
          .order("created_at", { ascending: false })
          .limit(10),
      ])

      setStats({
        users: usersResult.count || 0,
        managers: managersResult.count || 0,
        clients: clientsResult.count || 0,
        admins: adminsResult.count || 0,
        talents: talentsResult.count || 0,
        publishedTalents: publishedTalentsResult.count || 0,
        projects: projectsResult.count || 0,
        activeSubscriptions: subscriptionsResult.count || 0,
      })

      setAdmins(adminProfilesResult.data || [])
    } catch (error) {
      console.error(
        "Erreur chargement dashboard SuperAdmin :",
        error
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  useEffect(() => {
    loadDashboard()
  }, [])


  const handleRefresh = async () => {
    await loadDashboard()
  }


  const handleLogout = async () => {
    await logout()
  }


  return (
    <div className="min-h-screen bg-background">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black tracking-tight">
                    KORA
                  </h1>

                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold"
                  >
                    SUPERADMIN
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  Centre de contrôle CEO
                </p>
              </div>

            </div>


            <div className="flex items-center gap-2">

              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Actualiser"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </Button>

              <Link to="/home">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  Retour à KORA
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>

            </div>

          </div>
        </div>
      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HERO */}

        <div className="mb-8">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>SuperAdmin</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span>Dashboard CEO</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Bonjour {user?.name || "Elvis"} 👋
              </h2>

              <p className="text-muted-foreground mt-2 max-w-2xl">
                Vue globale de KORA, gestion des administrateurs,
                activité de la plateforme et contrôle stratégique.
              </p>

            </div>


            <div className="flex items-center gap-2">

              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Accès CEO
              </Badge>

              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1.5"
              >
                <Activity className="h-3.5 w-3.5" />
                Système actif
              </Badge>

            </div>

          </div>

        </div>


        {/* =====================================================
            STATISTICS
        ====================================================== */}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

          <StatCard
            title="Utilisateurs"
            value={loading ? "…" : formatNumber(stats.users)}
            description={`${formatNumber(stats.clients)} clients`}
            icon={Users}
          />

          <StatCard
            title="Managers"
            value={loading ? "…" : formatNumber(stats.managers)}
            description={`${formatNumber(stats.talents)} talents`}
            icon={UserCog}
          />

          <StatCard
            title="Projets"
            value={loading ? "…" : formatNumber(stats.projects)}
            description="Projets enregistrés"
            icon={BriefcaseBusiness}
          />

          <StatCard
            title="Abonnements actifs"
            value={
              loading
                ? "…"
                : formatNumber(stats.activeSubscriptions)
            }
            description="Abonnements actuellement actifs"
            icon={CreditCard}
          />

        </section>


        {/* =====================================================
            PLATFORM OVERVIEW
        ====================================================== */}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          <Card className="lg:col-span-2 border-border/70 shadow-sm">

            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    Vue plateforme
                  </CardTitle>

                  <p className="text-sm text-muted-foreground mt-1">
                    Répartition actuelle des comptes et contenus.
                  </p>
                </div>

                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>

            <CardContent>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Clients
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {formatNumber(stats.clients)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Managers
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {formatNumber(stats.managers)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Administrateurs
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {formatNumber(stats.admins)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Talents
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {formatNumber(stats.talents)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Talents publiés
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {formatNumber(stats.publishedTalents)}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Comptes totaux
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {formatNumber(stats.users)}
                  </p>
                </div>

              </div>

            </CardContent>

          </Card>


          {/* SYSTEM STATUS */}

          <Card className="border-border/70 shadow-sm">

            <CardHeader>
              <CardTitle className="text-lg">
                État du système
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Base de données
                  </span>
                </div>

                <Badge className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Actif
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Authentification
                  </span>
                </div>

                <Badge className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Actif
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Plateforme
                  </span>
                </div>

                <Badge className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  En ligne
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Services KORA
                  </span>
                </div>

                <Badge className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Opérationnel
                </Badge>
              </div>

            </CardContent>

          </Card>

        </section>


        {/* =====================================================
            ADMIN MANAGEMENT
        ====================================================== */}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          <Card className="lg:col-span-2 border-border/70 shadow-sm">

            <CardHeader>

              <div className="flex items-center justify-between gap-4">

                <div>
                  <CardTitle className="text-lg">
                    Administrateurs
                  </CardTitle>

                  <p className="text-sm text-muted-foreground mt-1">
                    Gestion des associés ayant accès au panneau
                    d'administration.
                  </p>
                </div>

                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    window.location.href = "/admin?view=administrators"
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Gérer
                </Button>

              </div>

            </CardHeader>


            <CardContent>

              {admins.length === 0 ? (

                <div className="rounded-xl border border-dashed p-8 text-center">

                  <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-3" />

                  <p className="font-semibold">
                    Aucun administrateur associé
                  </p>

                  <p className="text-sm text-muted-foreground mt-1">
                    Les administrateurs apparaîtront ici lorsqu'ils
                    seront créés.
                  </p>

                </div>

              ) : (

                <div className="space-y-2">

                  {admins.map((admin) => (

                    <div
                      key={admin.id}
                      className="flex items-center gap-3 rounded-xl border p-3"
                    >

                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">

                        {admin.avatar ? (
                          <img
                            src={admin.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCog className="h-5 w-5 text-muted-foreground" />
                        )}

                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="font-semibold text-sm truncate">
                          {admin.name || "Administrateur"}
                        </p>

                        <div className="flex items-center gap-2 mt-0.5">

                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            ADMIN
                          </Badge>

                          <span className="text-xs text-muted-foreground">
                            Compte administrateur
                          </span>

                        </div>

                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        title="Voir le profil"
                        onClick={() => {
                          window.location.href = `/admin?view=administrators&admin=${encodeURIComponent(admin.id)}`
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>

                    </div>

                  ))}

                </div>

              )}

            </CardContent>

          </Card>


          {/* CEO ACCESS */}

          <Card className="border-border/70 shadow-sm">

            <CardHeader>
              <CardTitle className="text-lg">
                Accès CEO
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              <div className="rounded-xl bg-muted/50 p-4">

                <div className="flex items-center gap-3">

                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                    <Crown className="h-5 w-5 text-primary-foreground" />
                  </div>

                  <div>
                    <p className="font-bold">
                      SuperAdmin
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Accès propriétaire / CEO
                    </p>
                  </div>

                </div>

              </div>

              <div className="space-y-2 text-sm">

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Gestion des administrateurs</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Vue globale de la plateforme</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Gestion stratégique</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Accès aux statistiques</span>
                </div>

              </div>

            </CardContent>

          </Card>

        </section>


        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}

        <section className="mb-8">

          <div className="mb-4">

            <h3 className="text-xl font-black tracking-tight">
              Actions rapides
            </h3>

            <p className="text-sm text-muted-foreground mt-1">
              Accédez rapidement aux principales zones de gestion.
            </p>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

            <QuickAction
              icon={Shield}
              title="Gestion des admins"
              description="Créer, modifier ou désactiver un admin"
              href="/admin?view=administrators"
            />

            <QuickAction
              icon={Users}
              title="Utilisateurs"
              description="Consulter les comptes KORA"
              href="/admin?view=users"
            />

            <QuickAction
              icon={UserCog}
              title="Managers"
              description="Superviser les managers"
              href="/admin"
            />

            <QuickAction
              icon={Star}
              title="Talents"
              description="Superviser les profils publiés"
              href="/categories"
            />

            <QuickAction
              icon={BriefcaseBusiness}
              title="Projets"
              description="Consulter l'activité des projets"
              href="/home"
            />

            <QuickAction
              icon={Settings}
              title="Paramètres"
              description="Configuration générale de KORA"
              href="/admin"
            />

          </div>

        </section>


        {/* =====================================================
            SECURITY
        ====================================================== */}

        <Card className="border-border/70 shadow-sm">

          <CardHeader>

            <div className="flex items-center gap-3">

              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>

              <div>
                <CardTitle className="text-lg">
                  Sécurité du compte CEO
                </CardTitle>

                <p className="text-sm text-muted-foreground mt-1">
                  Votre compte possède les privilèges SuperAdmin.
                </p>
              </div>

            </div>

          </CardHeader>

          <CardContent>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <div className="rounded-xl border p-4">

                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-semibold text-sm">
                    Rôle
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  superadmin
                </p>

              </div>


              <div className="rounded-xl border p-4">

                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-semibold text-sm">
                    Authentification
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Compte authentifié
                </p>

              </div>


              <div className="rounded-xl border p-4">

                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold text-sm">
                    Niveau d'accès
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Contrôle complet
                </p>

              </div>

            </div>

          </CardContent>

        </Card>

      </main>

    </div>
  )
}
