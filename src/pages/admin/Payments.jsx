import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, FileImage, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { validateAdminPayment } from "@/lib/admin"

function money(value, currency) {
  if (value == null) return "—"
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "XOF",
      maximumFractionDigits: 0,
    }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString("fr-FR")} ${currency || "XOF"}`
  }
}

export default function AdminPayments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState("paid")
  const [note, setNote] = useState("")
  const [proofPreviewUrl, setProofPreviewUrl] = useState("")
  const [proofPreviewError, setProofPreviewError] = useState("")
  const [loadingProof, setLoadingProof] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("id, user_id, subscription_id, plan_id, provider, provider_payment_id, reference, amount, currency, billing_cycle, status, proof_url, checkout_url, paid_at, metadata, created_at, updated_at")
        .order("created_at", { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (error) {
      toast.error(error?.message || "Impossible de charger les paiements.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openPayment = async (payment) => {
    setSelected(payment)
    setStatus(payment.status === "pending" ? "paid" : payment.status || "paid")
    setNote("")
    setProofPreviewUrl("")
    setProofPreviewError("")
    if (!payment.proof_url) return

    setLoadingProof(true)
    try {
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(payment.proof_url, 300)
      if (error) throw error
      setProofPreviewUrl(data?.signedUrl || "")
    } catch (error) {
      setProofPreviewError(error?.message || "Impossible d'ouvrir la preuve de paiement.")
    } finally {
      setLoadingProof(false)
    }
  }

  const submit = async () => {
    if (!selected) return
    if (status === "paid" && (!selected.proof_url || !proofPreviewUrl)) {
      toast.error("Une preuve de paiement consultable est obligatoire avant validation.")
      return
    }

    setSaving(true)
    try {
      await validateAdminPayment(selected.id, status, note)
      toast.success("Statut du paiement mis à jour.")
      setSelected(null)
      setNote("")
      setProofPreviewUrl("")
      await load()
    } catch (error) {
      toast.error(error?.message || "Impossible de valider le paiement.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Paiements</h1>
          <p className="text-sm text-muted-foreground">Validation manuelle après contrôle de la preuve.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Un abonnement n'est activé qu'après validation manuelle d'une preuve consultable.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
          ) : items.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">Aucun paiement enregistré.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/30 text-left">
                    <th className="px-4 py-3">Référence</th>
                    <th className="px-4 py-3">Prestataire</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Preuve</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/40">
                      <td className="px-4 py-3">
                        <p className="font-bold">{payment.reference || "—"}</p>
                        <p className="break-all text-xs text-muted-foreground">{payment.provider_payment_id || "ID prestataire non renseigné"}</p>
                      </td>
                      <td className="px-4 py-3">{payment.provider || "—"}</td>
                      <td className="px-4 py-3 font-bold">{money(payment.amount, payment.currency)}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{payment.status || "—"}</Badge></td>
                      <td className="px-4 py-3">
                        {payment.proof_url
                          ? <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">Reçue</Badge>
                          : <Badge variant="outline">Manquante</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" onClick={() => openPayment(payment)}>
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Gérer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => {
        if (!open) {
          setSelected(null)
          setProofPreviewUrl("")
          setProofPreviewError("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le paiement</DialogTitle>
            <DialogDescription>{selected?.reference || selected?.id}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Preuve de paiement</Label>
              {loadingProof ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement de la preuve…</div>
              ) : proofPreviewError ? (
                <p role="alert" className="text-sm text-destructive">{proofPreviewError}</p>
              ) : proofPreviewUrl && selected?.proof_url ? (
                /.pdf$/i.test(selected.proof_url) ? (
                  <a href={proofPreviewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold underline">
                    <FileImage className="h-4 w-4" /> Ouvrir la preuve PDF
                  </a>
                ) : (
                  <img src={proofPreviewUrl} alt="Capture de paiement fournie par le manager" className="max-h-72 w-full rounded-xl border border-border object-contain" />
                )
              ) : (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
                  Aucune preuve transmise. Le paiement ne peut pas être validé.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note admin</Label>
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note optionnelle…" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Annuler</Button>
            <Button onClick={submit} disabled={saving || (status === "paid" && (!selected?.proof_url || !proofPreviewUrl))}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
