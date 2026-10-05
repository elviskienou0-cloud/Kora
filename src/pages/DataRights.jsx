import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Download, Trash2, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"

const LABELS = {
  profile: "Profil",
  user_consents: "Consentements",
}

function labelFor(key) {
  if (LABELS[key]) return LABELS[key]
  return key
    .replace(/__([a-z_]+)$/i, " ($1)")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function DataRights() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const userId = user?.authId || user?.id
  const [exportedData, setExportedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!userId) return

      const { data, error } = await supabase.rpc("export_my_data")

      if (!mounted) return

      if (error) {
        toast.error(error.message)
      } else {
        setExportedData(data || null)
      }

      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [userId])

  const downloadData = () => {
    if (!exportedData) return

    const payload = {
      ...exportedData,
      exported_at: exportedData.exported_at || new Date().toISOString(),
    }

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: "application/json;charset=utf-8" }
    )

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "kora-mes-donnees.json"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const deleteAccount = async () => {
    const confirmed = window.confirm(
      "La suppression de votre compte est définitive. Vos données et médias liés seront supprimés, sauf les informations qui doivent légalement être conservées ou anonymisées. Continuer ?"
    )

    if (!confirmed) return

    setDeleting(true)

    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-account",
        { body: {} }
      )

      if (error) throw error
      if (!data?.ok) {
        throw new Error(
          data?.error || "La suppression du compte a échoué."
        )
      }

      await supabase.auth.signOut({ scope: "local" })
      await logout?.()
      navigate("/", { replace: true })
    } catch (error) {
      toast.error(
        error?.message ||
          "Impossible de supprimer le compte."
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    )
  }

  const sections = Object.entries(exportedData || {})
    .filter(([key]) => key !== "exported_at")

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        to="/home"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div>
        <h1 className="text-2xl font-black">
          Mes données personnelles
        </h1>
        <p className="text-sm text-muted-foreground">
          Consultez et exportez les données actuellement associées à votre
          compte KORA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Données associées à votre compte
          </CardTitle>
          <CardDescription>
            L'export inclut le profil, les consentements et les données métier
            directement ou indirectement rattachées à votre compte.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          {sections.length ? (
            sections.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    {labelFor(key)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Array.isArray(value)
                      ? `${value.length} élément(s)`
                      : "1 élément"}
                  </span>
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <p>Aucune donnée exportable n'a été trouvée.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Vous pouvez télécharger une copie structurée de vos données ou
            demander la suppression complète du compte.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={downloadData}
            disabled={!exportedData}
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger mes données
          </Button>

          <Button
            variant="destructive"
            onClick={deleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Supprimer mon compte
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Pour une demande qui n'est pas automatisée ici (rectification,
        opposition ou demande complémentaire), contactez{" "}
        <a
          className="underline"
          href="mailto:kora.contact1@gmail.com"
        >
          kora.contact1@gmail.com
        </a>.
      </p>
    </div>
  )
}
