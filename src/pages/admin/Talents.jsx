import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  XCircle,
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

import { supabase } from "@/lib/supabase"
import { adminModerateTalent } from "@/lib/admin"

const STATUS_LABELS = {
  pending: "En attente",
  published: "Publié",
  rejected: "Refusé",
  suspended: "Suspendu",
}

const STATUS_CLASSES = {
  pending:
    "bg-amber-500/10 text-amber-700 border-amber-500/30",
  published:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  rejected:
    "bg-red-500/10 text-red-700 border-red-500/30",
  suspended:
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

function getTalentName(talent) {
  return (
    [talent.first_name, talent.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || "Talent"
  )
}

export default function AdminTalents() {
  const [talents, setTalents] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const [processingId, setProcessingId] = useState(null)

  const loadTalents = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const { data, error: queryError } = await supabase
        .from("talent_profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          title,
          city,
          daily_rate,
          currency,
          status,
          is_visible,
          verified,
          available,
          managed_by,
          created_at,
          updated_at
          `
        )
        .order("updated_at", {
          ascending: false,
        })

      if (queryError) {
        throw queryError
      }

      setTalents(data || [])
    } catch (err) {
      console.error(
        "Erreur chargement talents admin :",
        err
      )

      setError(
        err?.message ||
          "Impossible de charger les talents."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTalents()
  }, [loadTalents])

  const filteredTalents = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return talents
    }

    return talents.filter((talent) => {
      const name = getTalentName(talent)

      return `
        ${name}
        ${talent.title || ""}
        ${talent.city || ""}
        ${talent.status || ""}
        ${talent.id || ""}
      `
        .toLowerCase()
        .includes(query)
    })
  }, [talents, search])

  const refresh = async () => {
    setRefreshing(true)

    try {
      await loadTalents()
    } finally {
      setRefreshing(false)
    }
  }

  const moderateTalent = async (
    talent,
    nextStatus,
    options = {}
  ) => {
    if (!talent?.id) {
      return
    }

    setProcessingId(talent.id)

    try {
      await adminModerateTalent({
        talentId: talent.id,
        status: nextStatus,
        visible:
          typeof options.visible === "boolean"
            ? options.visible
            : talent.is_visible,
        verified:
          typeof options.verified === "boolean"
            ? options.verified
            : talent.verified,
        reason: options.reason || "",
      })

      toast.success("Talent mis à jour.")

      await loadTalents()
    } catch (err) {
      console.error(
        "Erreur modération talent :",
        err
      )

      toast.error(
        "Impossible de modifier le talent",
        {
          description:
            err?.message ||
            "Veuillez réessayer.",
        }
      )
    } finally {
      setProcessingId(null)
    }
  }

  const toggleVisibility = async (talent) => {
    setProcessingId(talent.id)

    try {
      await adminModerateTalent({
        talentId: talent.id,
        status: talent.status || "pending",
        visible: !talent.is_visible,
        verified: talent.verified,
      })

      toast.success(
        talent.is_visible
          ? "Talent masqué."
          : "Talent rendu visible."
      )

      await loadTalents()
    } catch (err) {
      console.error(
        "Erreur visibilité talent :",
        err
      )

      toast.error(
        "Impossible de modifier la visibilité",
        {
          description:
            err?.message ||
            "Veuillez réessayer.",
        }
      )
    } finally {
      setProcessingId(null)
    }
  }

  const requestModerationReason = (actionLabel) => {
    const reason = window.prompt(`Motif pour ${actionLabel} (facultatif) :`, "")
    if (reason === null) return null
    return reason.trim()
  }

  const toggleVerified = async (talent) => {
    setProcessingId(talent.id)

    try {
      await adminModerateTalent({
        talentId: talent.id,
        status: talent.status || "pending",
        visible: talent.is_visible,
        verified: !talent.verified,
      })

      toast.success(
        talent.verified
          ? "Vérification retirée."
          : "Talent vérifié."
      )

      await loadTalents()
    } catch (err) {
      console.error(
        "Erreur vérification talent :",
        err
      )

      toast.error(
        "Impossible de modifier la vérification",
        {
          description:
            err?.message ||
            "Veuillez réessayer.",
        }
      )
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="
        flex
        flex-col
        lg:flex-row
        lg:items-center
        lg:justify-between
        gap-4
      ">

        <div>
          <h1 className="text-2xl font-black">
            Talents
          </h1>

          <p className="text-sm text-muted-foreground">
            Modération réelle des profils talents
            depuis Supabase.
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
          RECHERCHE
      ====================================================== */}

      <Card className="border-border/60">

        <CardContent className="p-5">

          <div className="relative max-w-xl">

            <Search
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                h-4
                w-4
                text-muted-foreground
              "
            />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un talent..."
              className="pl-10"
            />

          </div>

        </CardContent>

      </Card>


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (

        <Card className="
          border-red-500/30
          bg-red-500/5
        ">

          <CardContent className="
            p-4
            text-sm
            text-red-700
          ">
            {error}
          </CardContent>

        </Card>

      )}


      {/* =====================================================
          TALENTS
      ====================================================== */}

      <Card className="
        border-border/60
        overflow-hidden
      ">

        <CardHeader>

          <CardTitle className="font-black">
            Profils talents
          </CardTitle>

          <CardDescription>
            Statut, visibilité et vérification.
          </CardDescription>

        </CardHeader>


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

              <Loader2 className="
                h-5
                w-5
                animate-spin
              " />

              Chargement des talents…

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
                      px-5
                      py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    ">
                      Talent
                    </th>

                    <th className="
                      px-5
                      py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    ">
                      Statut
                    </th>

                    <th className="
                      px-5
                      py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    ">
                      Visibilité
                    </th>

                    <th className="
                      px-5
                      py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    ">
                      Vérification
                    </th>

                    <th className="
                      px-5
                      py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                    ">
                      Mise à jour
                    </th>

                    <th className="
                      px-5
                      py-3
                      text-xs
                      uppercase
                      tracking-wider
                      text-muted-foreground
                      text-right
                    ">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredTalents.map((talent) => {

                    const busy =
                      processingId === talent.id

                    const name =
                      getTalentName(talent)

                    return (

                      <tr
                        key={talent.id}
                        className="
                          border-b
                          border-border/40
                          hover:bg-accent/30
                        "
                      >

                        {/* TALENT */}

                        <td className="
                          px-5
                          py-4
                        ">

                          <div className="
                            flex
                            items-center
                            gap-3
                          ">

                            <div className="
                              h-10
                              w-10
                              shrink-0
                              rounded-full
                              bg-gold/10
                              flex
                              items-center
                              justify-center
                              font-black
                              text-gold-dark
                            ">
                              {name
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">

                              <p className="
                                font-bold
                                truncate
                              ">
                                {name}
                              </p>

                              <p className="
                                text-xs
                                text-muted-foreground
                                truncate
                              ">
                                {talent.title ||
                                  "Profil talent"}
                                {talent.city
                                  ? ` · ${talent.city}`
                                  : ""}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* STATUT */}

                        <td className="px-5 py-4">

                          <Badge
                            variant="outline"
                            className={
                              STATUS_CLASSES[
                                talent.status
                              ] || ""
                            }
                          >
                            {STATUS_LABELS[
                              talent.status
                            ] ||
                              talent.status ||
                              "—"}
                          </Badge>

                        </td>


                        {/* VISIBILITE */}

                        <td className="
                          px-5
                          py-4
                        ">

                          {talent.is_visible ? (

                            <Badge
                              variant="outline"
                              className="
                                gap-1
                                border-emerald-500/30
                                bg-emerald-500/10
                                text-emerald-700
                              "
                            >

                              <Eye className="
                                h-3
                                w-3
                              " />

                              Visible

                            </Badge>

                          ) : (

                            <Badge
                              variant="outline"
                              className="
                                gap-1
                                border-muted-foreground/30
                              "
                            >

                              <EyeOff className="
                                h-3
                                w-3
                              " />

                              Masqué

                            </Badge>

                          )}

                        </td>


                        {/* VERIFIED */}

                        <td className="
                          px-5
                          py-4
                        ">

                          {talent.verified ? (

                            <Badge
                              variant="outline"
                              className="
                                gap-1
                                border-blue-500/30
                                bg-blue-500/10
                                text-blue-700
                              "
                            >

                              <ShieldCheck className="
                                h-3
                                w-3
                              " />

                              Vérifié

                            </Badge>

                          ) : (

                            <Badge
                              variant="outline"
                              className="gap-1"
                            >

                              <ShieldOff className="
                                h-3
                                w-3
                              " />

                              Non vérifié

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
                          {formatDate(
                            talent.updated_at
                          )}
                        </td>


                        {/* ACTIONS */}

                        <td className="
                          px-5
                          py-4
                        ">

                          <div className="
                            flex
                            justify-end
                            gap-2
                            flex-wrap
                          ">

                            {/* VISIBILITE */}

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                toggleVisibility(
                                  talent
                                )
                              }
                              title={
                                talent.is_visible
                                  ? "Masquer"
                                  : "Rendre visible"
                              }
                            >

                              {busy ? (
                                <Loader2 className="
                                  h-4
                                  w-4
                                  animate-spin
                                " />
                              ) : talent.is_visible ? (
                                <EyeOff className="
                                  h-4
                                  w-4
                                " />
                              ) : (
                                <Eye className="
                                  h-4
                                  w-4
                                " />
                              )}

                            </Button>


                            {/* VERIFICATION */}

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                toggleVerified(
                                  talent
                                )
                              }
                              title={
                                talent.verified
                                  ? "Retirer vérification"
                                  : "Vérifier"
                              }
                            >

                              <ShieldCheck className="
                                h-4
                                w-4
                              " />

                            </Button>


                            {/* PUBLISH */}

                            {talent.status !==
                              "published" && (

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() =>
                                  moderateTalent(
                                    talent,
                                    "published",
                                    {
                                      visible: true,
                                    }
                                  )
                                }
                                className="gap-1"
                              >

                                <CheckCircle2 className="
                                  h-4
                                  w-4
                                " />

                                Publier

                              </Button>

                            )}


                            {/* REJECT */}

                            {talent.status !==
                              "rejected" && (

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() => {
                                  const reason = requestModerationReason("refuser ce profil")
                                  if (reason !== null) {
                                    moderateTalent(talent, "rejected", {
                                      visible: false,
                                      reason,
                                    })
                                  }
                                }}
                                className="
                                  gap-1
                                  text-red-700
                                "
                              >

                                <XCircle className="
                                  h-4
                                  w-4
                                " />

                                Refuser

                              </Button>

                            )}


                            {/* SUSPEND */}

                            {talent.status !==
                              "suspended" && (

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() => {
                                  const reason = requestModerationReason("suspendre ce profil")
                                  if (reason !== null) {
                                    moderateTalent(talent, "suspended", {
                                      visible: false,
                                      reason,
                                    })
                                  }
                                }}
                                className="
                                  gap-1
                                  text-red-700
                                "
                              >
                                Suspendre
                              </Button>

                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  })}

                </tbody>

              </table>


              {!filteredTalents.length && (

                <div className="
                  py-14
                  text-center
                  text-sm
                  text-muted-foreground
                ">
                  Aucun talent trouvé.
                </div>

              )}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  )
}