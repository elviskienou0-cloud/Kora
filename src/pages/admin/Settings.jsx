import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Loader2, RefreshCw, Save, Settings as SettingsIcon, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

const DEFAULTS = {
  site_name: "KORA",
  site_tagline: "La plateforme des talents africains",
  support_email: "support@kora.africa",
  contact_email: "hello@kora.africa",
  currency: "XOF",
  commission_rate: 5,
  maintenance_mode: false,
  registrations_enabled: true,
  talent_auto_publish: false,
}

const SECTIONS = [
  { title: "Général", description: "Informations publiques de la plateforme.", keys: ["site_name", "site_tagline", "support_email", "contact_email", "currency"] },
  { title: "Business", description: "Paramètres appliqués aux transactions KORA.", keys: ["commission_rate"] },
  { title: "Plateforme", description: "Contrôles opérationnels de KORA.", keys: ["maintenance_mode", "registrations_enabled", "talent_auto_publish"] },
]

const LABELS = {
  site_name: "Nom de la plateforme",
  site_tagline: "Slogan",
  support_email: "Email support",
  contact_email: "Email de contact",
  currency: "Devise",
  commission_rate: "Commission KORA (%)",
  maintenance_mode: "Mode maintenance",
  registrations_enabled: "Nouvelles inscriptions",
  talent_auto_publish: "Publication automatique des talents",
}

const DESCRIPTION = {
  commission_rate: "Taux utilisé automatiquement pour calculer la commission sur les transactions KORA.",
  maintenance_mode: "Active temporairement le mode maintenance.",
  registrations_enabled: "Autorise ou bloque les nouvelles inscriptions.",
  talent_auto_publish: "Contrôle la publication automatique des nouveaux talents.",
}

function parseValue(key, value) {
  if (value === undefined || value === null) return DEFAULTS[key]
  if (key === "commission_rate") return Number(value)
  if (["maintenance_mode", "registrations_enabled", "talent_auto_publish"].includes(key)) return Boolean(value)
  return String(value)
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState("")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError("")
    const { data, error: rpcError } = await supabase.rpc("get_kora_settings")
    if (rpcError) {
      setError(rpcError.message || "Impossible de charger les paramètres.")
      setLoading(false)
      return
    }

    const next = { ...DEFAULTS }
    for (const row of data || []) next[row.key] = parseValue(row.key, row.value)
    setSettings(next)
    setLoading(false)
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const updateLocal = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setSaved("")
  }

  const save = async (key) => {
    setSaving(key)
    setError("")
    setSaved("")
    try {
      let value = settings[key]
      if (key === "commission_rate") {
        value = Number(value)
        if (!Number.isFinite(value) || value < 0 || value > 100) {
          throw new Error("La commission doit être comprise entre 0 et 100%.")
        }
      }

      const { error: rpcError } = await supabase.rpc("update_kora_setting", {
        p_key: key,
        p_value: value,
      })
      if (rpcError) throw rpcError
      setSaved(key)
      window.setTimeout(() => setSaved((current) => current === key ? "" : current), 2500)
    } catch (err) {
      setError(err?.message || "Impossible d'enregistrer ce paramètre.")
    } finally {
      setSaving("")
    }
  }

  const sections = useMemo(() => SECTIONS, [])

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Paramètres KORA
              </CardTitle>
              <CardDescription>
                Les modifications sont enregistrées directement dans Supabase et utilisées par les workflows KORA concernés.
              </CardDescription>
            </div>
            <Button variant="outline" className="gap-2" onClick={loadSettings} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Seul un compte administrateur peut modifier ces paramètres.</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement des paramètres…
            </div>
          ) : (
            sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <div>
                  <h2 className="text-base font-bold">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>

                {section.keys.map((key) => {
                  const value = settings[key]
                  const isBoolean = typeof DEFAULTS[key] === "boolean"
                  const isNumber = key === "commission_rate"

                  return (
                    <div key={key} className="rounded-xl border border-border/60 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <Label className="font-semibold">{LABELS[key]}</Label>
                          {DESCRIPTION[key] && (
                            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{DESCRIPTION[key]}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:min-w-[280px] sm:justify-end">
                          {isBoolean ? (
                            <button
                              type="button"
                              onClick={() => updateLocal(key, !value)}
                              className={`relative h-8 w-14 rounded-full border transition-colors ${value ? "bg-primary" : "bg-muted"}`}
                              aria-pressed={value}
                            >
                              <span className={`absolute top-1 h-6 w-6 rounded-full bg-background shadow transition-transform ${value ? "translate-x-7" : "translate-x-1"}`} />
                            </button>
                          ) : (
                            <Input
                              type={isNumber ? "number" : key.includes("email") ? "email" : "text"}
                              min={isNumber ? 0 : undefined}
                              max={isNumber ? 100 : undefined}
                              step={isNumber ? 0.1 : undefined}
                              value={value ?? ""}
                              onChange={(event) => updateLocal(key, isNumber ? event.target.value : event.target.value)}
                              className="w-full sm:w-64"
                            />
                          )}

                          <Button type="button" size="sm" onClick={() => save(key)} disabled={saving === key} className="shrink-0 gap-2">
                            {saving === key ? <Loader2 className="h-4 w-4 animate-spin" /> : saved === key ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {saved === key ? "Enregistré" : "Enregistrer"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </section>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
