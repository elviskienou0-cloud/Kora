import { useState } from "react"
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { reactivateAdminUser, suspendAdminUser } from "@/lib/admin"

export default function AdminUserActions({ user, onChanged }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const suspend = async () => {
    setSaving(true)
    try {
      await suspendAdminUser(user.id, reason)
      toast.success("Utilisateur suspendu.")
      setOpen(false)
      setReason("")
      await onChanged?.()
    } catch (err) {
      toast.error("Échec de la suspension", { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  const reactivate = async () => {
    setSaving(true)
    try {
      await reactivateAdminUser(user.id)
      toast.success("Utilisateur réactivé.")
      await onChanged?.()
    } catch (err) {
      toast.error("Échec de la réactivation", { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {user.is_suspended ? (
        <Button size="sm" variant="outline" className="gap-2" disabled={saving} onClick={reactivate}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Réactiver
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="gap-2" disabled={saving || user.role === "admin"} onClick={() => setOpen(true)}>
          <ShieldAlert className="h-4 w-4" />
          Suspendre
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre le compte</DialogTitle>
            <DialogDescription>Le serveur enregistrera également l'action dans admin_audit_logs.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif (facultatif)" rows={4} />
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Annuler</Button>
            <Button disabled={saving} onClick={suspend}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
