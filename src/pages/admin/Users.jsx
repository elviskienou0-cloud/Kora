import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Edit3, Loader2, RefreshCw, Search, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { listAdminUsers, updateAdminUser, deleteAdminUser, suspendAdminUser, reactivateAdminUser } from "@/lib/admin"

function dateFR(value) { return value ? new Date(value).toLocaleDateString("fr-FR") : "—" }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [searchParams] = useSearchParams()
  const urlQuery = searchParams.get("q") || ""
  const [search, setSearch] = useState(urlQuery)
  useEffect(() => { setSearch(urlQuery) }, [urlQuery])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [suspending, setSuspending] = useState(null)
  const [reason, setReason] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listAdminUsers({ search, page, pageSize: 20 })
      setUsers(result.data || [])
      setTotalPages(result.totalPages || 1)
    } catch (error) { toast.error(error?.message || "Impossible de charger les utilisateurs.") }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { const t = setTimeout(() => { load() }, 150); return () => clearTimeout(t) }, [load])
  useEffect(() => { setPage(1) }, [search])

  const submitEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await updateAdminUser(editing.id, { name: editing.name, role: editing.role, phone: editing.phone, city: editing.city, company: editing.company, bio: editing.bio })
      toast.success("Utilisateur mis à jour ✅")
      setEditing(null)
      await load()
    } catch (error) {
      console.error("KORA admin update user:", error)
      toast.error(error?.message || "Impossible de modifier l'utilisateur.")
    }
    finally { setSaving(false) }
  }

  const removeUser = async (user) => {
    if (!window.confirm(`Supprimer définitivement ${user.name || "cet utilisateur"} ?`)) return
    setSaving(true)
    try { await deleteAdminUser(user.id); toast.success("Utilisateur supprimé ✅"); await load() }
    catch (error) {
      console.error("KORA admin delete user:", error)
      toast.error(error?.message || "Impossible de supprimer l'utilisateur.")
    }
    finally { setSaving(false) }
  }

  const toggleSuspend = async (user) => {
    setSaving(true)
    try {
      if (user.is_suspended) { await reactivateAdminUser(user.id); toast.success("Utilisateur réactivé ✅") }
      else { await suspendAdminUser(user.id, reason || "Suspension décidée par l'administration"); toast.success("Utilisateur suspendu ✅") }
      setSuspending(null); setReason(""); await load()
    } catch (error) { toast.error(error?.message || "Impossible de modifier le statut.") }
    finally { setSaving(false) }
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-2xl font-black">Utilisateurs</h1><p className="text-sm text-muted-foreground">Modifier, suspendre, réactiver ou supprimer un compte.</p></div><div className="flex gap-2"><div className="relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-10" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button></div></div>
    <Card><CardHeader><CardTitle>Comptes KORA</CardTitle><CardDescription>Données Supabase réelles.</CardDescription></CardHeader><CardContent className="p-0">
      {loading ? <div className="py-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y bg-muted/30 text-left"><th className="px-4 py-3">Utilisateur</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Inscription</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{users.map((u) => <tr key={u.id} className="border-b border-border/40"><td className="px-4 py-3"><p className="font-bold">{u.name || "Sans nom"}</p><p className="text-[11px] text-muted-foreground break-all">{u.id}</p></td><td className="px-4 py-3"><Badge variant="outline">{u.role}</Badge></td><td className="px-4 py-3">{u.is_suspended ? <Badge className="bg-red-500/10 text-red-700">Suspendu</Badge> : <Badge className="bg-emerald-500/10 text-emerald-700">Actif</Badge>}</td><td className="px-4 py-3">{dateFR(u.created_at)}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEditing({...u})}><Edit3 className="mr-1 h-4 w-4" />Modifier</Button>{u.is_suspended ? <Button size="sm" variant="outline" onClick={() => toggleSuspend(u)} disabled={saving}><ShieldCheck className="mr-1 h-4 w-4" />Réactiver</Button> : <Button size="sm" variant="outline" onClick={() => setSuspending(u)} disabled={saving}><ShieldAlert className="mr-1 h-4 w-4" />Suspendre</Button>}<Button size="sm" variant="destructive" onClick={() => removeUser(u)} disabled={saving || u.role === "admin"}><Trash2 className="mr-1 h-4 w-4" />Supprimer</Button></div></td></tr>)}</tbody></table></div>}
    </CardContent></Card>
    <div className="flex items-center justify-between text-sm"><span>Page {page} / {totalPages}</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button><Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</Button></div></div>

    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Modifier l'utilisateur</DialogTitle><DialogDescription>Les modifications sont enregistrées via une fonction SQL administrateur.</DialogDescription></DialogHeader>{editing && <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>Nom</Label><Input value={editing.name || ""} onChange={(e) => setEditing({...editing, name: e.target.value})} /></div><div className="space-y-2"><Label>Rôle</Label><select value={editing.role} onChange={(e) => setEditing({...editing, role: e.target.value})} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="client">Client</option><option value="manager">Manager</option><option value="admin">Administrateur</option></select></div><div className="space-y-2"><Label>Téléphone</Label><Input value={editing.phone || ""} onChange={(e) => setEditing({...editing, phone: e.target.value})} /></div><div className="space-y-2"><Label>Ville</Label><Input value={editing.city || ""} onChange={(e) => setEditing({...editing, city: e.target.value})} /></div><div className="space-y-2"><Label>Entreprise</Label><Input value={editing.company || ""} onChange={(e) => setEditing({...editing, company: e.target.value})} /></div><div className="space-y-2 md:col-span-2"><Label>Bio</Label><Textarea rows={4} value={editing.bio || ""} onChange={(e) => setEditing({...editing, bio: e.target.value})} /></div></div>}<DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button><Button onClick={submitEdit} disabled={saving}>{saving ? "Enregistrement…" : "Mettre à jour"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(suspending)} onOpenChange={(open) => !open && setSuspending(null)}><DialogContent><DialogHeader><DialogTitle>Suspendre le compte</DialogTitle><DialogDescription>Cette action sera journalisée dans l'administration.</DialogDescription></DialogHeader><Textarea placeholder="Raison de la suspension (optionnel)" value={reason} onChange={(e) => setReason(e.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setSuspending(null)}>Annuler</Button><Button variant="destructive" onClick={() => toggleSuspend(suspending)} disabled={saving}>Confirmer</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
