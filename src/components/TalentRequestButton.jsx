import { useState } from "react"
import { CalendarDays, Loader2, MapPin, Send, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/AuthContext"
import { createRequestFromTalent } from "@/lib/requestInvitations"
import { useI18n } from "@/i18n/kora-i18n.jsx"

const PROJECT_TYPES = [
  { value: "advertising", key: "advertising" },
  { value: "event", key: "event" },
  { value: "music_video", key: "musicVideo" },
  { value: "shooting", key: "shooting" },
  { value: "social_campaign", key: "socialCampaign" },
  { value: "fashion", key: "fashion" },
  { value: "film_tv", key: "filmTv" },
  { value: "other", key: "other" },
]

export default function TalentRequestButton({ talentId, talentName = "ce talent" }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const authUserId = user?.authId || user?.id

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    projectType: "",
    description: "",
    projectDateStart: "",
    projectDateEnd: "",
    budget: "",
    location: "",
    additionalInfo: "",
  })

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const close = () => {
    if (loading) return
    setOpen(false)
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!authUserId) {
      toast.info(t("talent.loginToInvite"))
      return
    }

    if (!form.title.trim()) {
      toast.error(t("requestForm.titleRequired"))
      return
    }

    if (!form.description.trim()) {
      toast.error(t("requestForm.descriptionRequired"))
      return
    }

    if (
      form.projectDateStart &&
      form.projectDateEnd &&
      form.projectDateEnd < form.projectDateStart
    ) {
      toast.error(t("requestForm.dateInvalid"))
      return
    }

    setLoading(true)

    try {
      await createRequestFromTalent({
        talentId,
        title: form.title,
        projectType: form.projectType,
        description: form.description,
        projectDateStart: form.projectDateStart,
        projectDateEnd: form.projectDateEnd,
        budget: form.budget,
        currency: "XOF",
        location: form.location,
        additionalInfo: form.additionalInfo,
      })

      toast.success(t("requestForm.sent"), {
        description: t("requestForm.sentDescription"),
      })
      setForm({
        title: "",
        projectType: "",
        description: "",
        projectDateStart: "",
        projectDateEnd: "",
        budget: "",
        location: "",
        additionalInfo: "",
      })
      setOpen(false)
    } catch (error) {
      console.error("Erreur création demande :", error)
      toast.error(t("requestForm.error"), {
        description: error?.message || t("common.retry"),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" />
        {t("requestForm.openButton")}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl">
            <Card className="max-h-[92vh] overflow-y-auto border-gold/20 shadow-2xl">
              <CardHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="outline" className="border-gold/30 bg-gold/5 text-gold-dark">
                      {t("requestForm.badge")}
                    </Badge>
                    <CardTitle className="mt-2 text-xl">{t("requestForm.title")}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("requestForm.forTalent", "Pour {talent}", { talent: talentName })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={close} disabled={loading} aria-label={t("common.close")}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="request-title">{t("requestForm.projectTitle")} *</Label>
                      <Input
                        id="request-title"
                        value={form.title}
                        onChange={setField("title")}
                        placeholder={t("requestForm.projectTitlePlaceholder")}
                        maxLength={180}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="request-type">{t("requestForm.projectType")}</Label>
                      <select
                        id="request-type"
                        value={form.projectType}
                        onChange={setField("projectType")}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        disabled={loading}
                      >
                        <option value="">{t("requestForm.selectType")}</option>
                        {PROJECT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{t(`requestForm.types.${type.key}`)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="request-budget">{t("requestForm.budget")}</Label>
                      <Input
                        id="request-budget"
                        type="number"
                        min="0"
                        step="1"
                        value={form.budget}
                        onChange={setField("budget")}
                        placeholder="150000"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="request-description">{t("requestForm.description")} *</Label>
                      <Textarea
                        id="request-description"
                        value={form.description}
                        onChange={setField("description")}
                        placeholder={t("requestForm.descriptionPlaceholder")}
                        rows={5}
                        maxLength={5000}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="request-date-start">{t("requestForm.dateStart")}</Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="request-date-start" type="date" value={form.projectDateStart} onChange={setField("projectDateStart")} className="pl-10" disabled={loading} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="request-date-end">{t("requestForm.dateEnd")}</Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="request-date-end" type="date" value={form.projectDateEnd} onChange={setField("projectDateEnd")} className="pl-10" disabled={loading} />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="request-location">{t("requestForm.location")}</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="request-location" value={form.location} onChange={setField("location")} placeholder={t("requestForm.locationPlaceholder")} className="pl-10" disabled={loading} />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="request-additional">{t("requestForm.additionalInfo")}</Label>
                      <Textarea
                        id="request-additional"
                        value={form.additionalInfo}
                        onChange={setField("additionalInfo")}
                        placeholder={t("requestForm.additionalInfoPlaceholder")}
                        rows={4}
                        maxLength={4000}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-muted-foreground">
                    {t("requestForm.notice")}
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={close} disabled={loading}>{t("common.cancel")}</Button>
                    <Button type="submit" className="gap-2 gold-gradient text-white" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {loading ? t("common.saving") : t("requestForm.submit")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
