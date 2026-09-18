import { useCallback, useEffect, useState } from "react"
import {
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  listAdminUsers,
  suspendAdminUser,
  reactivateAdminUser,
} from "@/lib/admin"

const ROLE_LABELS = {
  client: "Client",
  manager: "Manager",
  admin: "Administrateur",
}

const ROLE_CLASSES = {
  client:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  manager:
    "bg-gold/10 text-gold-dark border-gold/30",
  admin:
    "bg-red-500/10 text-red-700 border-red-500/30",
}

function formatDate(value) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function initials(name = "Utilisateur") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState("")

  const [search, setSearch] = useState("")

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [suspendTarget, setSuspendTarget] = useState(null)
  const [reason, setReason] = useState("")

  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const result = await listAdminUsers({
        search,
        page,
        pageSize: 20,
      })

      setUsers(result.data || [])
      setTotalPages(result.totalPages || 1)
    } catch (err) {
      console.error(
        "Erreur chargement utilisateurs admin :",
        err
      )

      setError(
        err?.message ||
          "Impossible de charger les utilisateurs."
      )
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [search])

  const refresh = async () => {
    setRefreshing(true)

    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  const handleSuspend = async () => {
    if (!suspendTarget) {
      return
    }

    setSaving(true)

    try {
      await suspendAdminUser(
        suspendTarget.id,
        reason
      )

      toast.success("Utilisateur suspendu.")

      setSuspendTarget(null)
      setReason("")

      await load()
    } catch (err) {
      console.error(
        "Erreur suspension utilisateur :",
        err
      )

      toast.error(
        "Impossible de suspendre le compte",
        {
          description:
            err?.message ||
            "Veuillez réessayer.",
        }
      )
    } finally {
      setSaving(false)
    }
  }

  const handleReactivate = async (user) => {
    if (!user?.id) {
      return
    }

    setSaving(true)

    try {
      await reactivateAdminUser(user.id)

      toast.success("Utilisateur réactivé.")

      await load()
    } catch (err) {
      console.error(
        "Erreur réactivation utilisateur :",
        err
      )

      toast.error(
        "Impossible de réactiver le compte",
        {
          description:
            err?.message ||
            "Veuillez réessayer.",
        }
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-black">
            Utilisateurs
          </h1>

          <p className="text-sm text-muted-foreground">
            Gestion réelle des comptes KORA depuis Supabase.
          </p>
        </div>

        <Button
          variant="outline"
          className="gap-2"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Actualiser
        </Button>
      </div>


      {/* =====================================================
          TABLE
      ====================================================== */}

      <Card className="border-border/60 overflow-hidden">

        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <CardTitle className="font-black">
              Comptes
            </CardTitle>

            <CardDescription>
              Suspendre ou réactiver un compte avec
              journalisation côté serveur.
            </CardDescription>
          </div>

          <div className="relative w-full md:w-80">

            <Search
              className="absolute left-3 top-1/2
              -translate-y-1/2 h-4 w-4
              text-muted-foreground"
            />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher par nom..."
              className="pl-10"
            />

          </div>

        </CardHeader>


        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <CardContent className="pt-0">

            <div
              className="
                rounded-xl
                border border-red-500/30
                bg-red-500/5
                p-4
                text-sm
                text-red-700
              "
            >
              {error}
            </div>

          </CardContent>
        )}


        {/* =====================================================
            CONTENT
        ====================================================== */}

        <CardContent className="p-0">

          {loading ? (

            <div className="
              py-16
              flex
              items-center
              justify-center
              gap-2
              text-sm
              text-muted-foreground
            ">

              <Loader2 className="h-5 w-5 animate-spin" />

              Chargement…

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="
                    border-y
                    border-border/60
                    bg-muted/30
                    text-left
                  ">

                    <th className="
                      px-5 py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    ">
                      Utilisateur
                    </th>

                    <th className="
                      px-5 py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    ">
                      Rôle
                    </th>

                    <th className="
                      px-5 py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    ">
                      Statut
                    </th>

                    <th className="
                      px-5 py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    ">
                      Inscription
                    </th>

                    <th className="
                      px-5 py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                      text-right
                    ">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {users.map((user) => (

                    <tr
                      key={user.id}
                      className="
                        border-b
                        border-border/40
                        hover:bg-accent/30
                      "
                    >

                      {/* UTILISATEUR */}

                      <td className="px-5 py-4">

                        <div className="
                          flex
                          items-center
                          gap-3
                        ">

                          <div className="
                            h-10
                            w-10
                            rounded-full
                            bg-gold/10
                            flex
                            items-center
                            justify-center
                            font-black
                            text-gold-dark
                          ">
                            {initials(user.name)}
                          </div>

                          <div className="min-w-0">

                            <p className="
                              font-bold
                              truncate
                            ">
                              {user.name ||
                                "Utilisateur"}
                            </p>

                            <p className="
                              text-xs
                              text-muted-foreground
                            ">
                              {String(user.id).slice(
                                0,
                                8
                              )}
                              …
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* ROLE */}

                      <td className="px-5 py-4">

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            ROLE_CLASSES[user.role] ||
                              ""
                          )}
                        >
                          {ROLE_LABELS[user.role] ||
                            user.role ||
                            "Inconnu"}
                        </Badge>

                      </td>


                      {/* STATUT */}

                      <td className="px-5 py-4">

                        {user.is_suspended ? (

                          <div className="space-y-1">

                            <Badge
                              variant="outline"
                              className="
                                border-red-500/30
                                bg-red-500/10
                                text-red-700
                              "
                            >
                              Suspendu
                            </Badge>

                            {user.suspended_reason && (
                              <p className="
                                max-w-xs
                                text-xs
                                text-muted-foreground
                              ">
                                {user.suspended_reason}
                              </p>
                            )}

                          </div>

                        ) : (

                          <Badge
                            variant="outline"
                            className="
                              border-emerald-500/30
                              bg-emerald-500/10
                              text-emerald-700
                            "
                          >
                            Actif
                          </Badge>

                        )}

                      </td>


                      {/* DATE */}

                      <td className="
                        px-5
                        py-4
                        text-xs
                        text-muted-foreground
                      ">
                        {formatDate(user.created_at)}
                      </td>


                      {/* ACTION */}

                      <td className="
                        px-5
                        py-4
                        text-right
                      ">

                        {user.is_suspended ? (

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() =>
                              handleReactivate(user)
                            }
                            className="gap-2"
                          >

                            <ShieldCheck
                              className="h-4 w-4"
                            />

                            Réactiver

                          </Button>

                        ) : (

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              saving ||
                              user.role === "admin"
                            }
                            onClick={() =>
                              setSuspendTarget(user)
                            }
                            className="gap-2"
                          >

                            <ShieldAlert
                              className="h-4 w-4"
                            />

                            Suspendre

                          </Button>

                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>


              {!users.length && (

                <div className="
                  py-14
                  text-center
                  text-sm
                  text-muted-foreground
                ">
                  Aucun utilisateur trouvé.
                </div>

              )}

            </div>

          )}

        </CardContent>

      </Card>


      {/* =====================================================
          PAGINATION
      ====================================================== */}

      <div className="
        flex
        items-center
        justify-between
      ">

        <p className="
          text-xs
          text-muted-foreground
        ">
          Page {page} / {totalPages}
        </p>

        <div className="flex gap-2">

          <Button
            variant="outline"
            size="sm"
            disabled={
              page <= 1 ||
              loading
            }
            onClick={() =>
              setPage((value) =>
                Math.max(1, value - 1)
              )
            }
          >
            Précédent
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={
              page >= totalPages ||
              loading
            }
            onClick={() =>
              setPage((value) =>
                Math.min(
                  totalPages,
                  value + 1
                )
              )
            }
          >
            Suivant
          </Button>

        </div>

      </div>


      {/* =====================================================
          SUSPENSION DIALOG
      ====================================================== */}

      <Dialog
        open={Boolean(suspendTarget)}
        onOpenChange={(open) => {

          if (!open && !saving) {
            setSuspendTarget(null)
            setReason("")
          }

        }}
      >

        <DialogContent>

          <DialogHeader>

            <DialogTitle>
              Suspendre le compte
            </DialogTitle>

            <DialogDescription>
              Le changement sera effectué côté serveur
              et enregistré dans les logs
              d'administration.
            </DialogDescription>

          </DialogHeader>


          <div className="space-y-3">

            <p className="text-sm">

              Compte :

              <strong className="ml-1">
                {suspendTarget?.name ||
                  "Utilisateur"}
              </strong>

            </p>

            <Textarea
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              placeholder="
                Motif de suspension (facultatif)
              "
              rows={4}
            />

          </div>


          <DialogFooter>

            <Button
              variant="outline"
              disabled={saving}
              onClick={() => {
                setSuspendTarget(null)
                setReason("")
              }}
            >
              Annuler
            </Button>

            <Button
              disabled={saving}
              onClick={handleSuspend}
            >

              {saving && (
                <Loader2
                  className="
                    h-4 w-4
                    animate-spin
                    mr-2
                  "
                />
              )}

              Confirmer la suspension

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  )
}