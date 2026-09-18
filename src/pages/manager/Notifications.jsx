import { useCallback, useEffect, useState } from "react"
import { Bell, Check, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"

export default function ManagerNotifications() {
  const { user } = useAuth()
  const userId = user?.authId || user?.id
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, type, title, message, data, is_read, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur chargement notifications manager :", error)
      toast.error(error.message || "Impossible de charger les notifications.")
      setNotifications([])
      return
    }
    setNotifications(data || [])
  }, [userId])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    loadNotifications().finally(() => setLoading(false))
  }, [userId, loadNotifications])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`manager-notifications-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => loadNotifications())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId, loadNotifications])

  const markRead = async (notification) => {
    if (!notification?.id || notification.is_read || notification.read_at) return
    const readAt = new Date().toISOString()
    const { error } = await supabase.from("notifications").update({ is_read: true, read_at: readAt }).eq("id", notification.id).eq("user_id", userId)
    if (error) {
      toast.error(error.message || "Impossible de marquer la notification.")
      return
    }
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true, read_at: readAt } : item))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Espace Manager</p>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">Recevez les nouvelles invitations et les mises à jour importantes.</p>
          </div>
          <Button variant="outline" onClick={async () => { setRefreshing(true); await loadNotifications(); setRefreshing(false) }} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Actualiser
          </Button>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
        ) : notifications.length === 0 ? (
          <Card className="border-dashed border-gold/30"><CardContent className="py-20 text-center"><Bell className="mx-auto mb-3 h-9 w-9 text-gold" /><p className="font-semibold">Aucune notification</p><p className="mt-1 text-sm text-muted-foreground">Vous serez averti ici lorsqu'un client vous invitera.</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card key={notification.id} className={`${notification.is_read || notification.read_at ? "border-border/60" : "border-gold/30 bg-gold/5"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold"><Bell className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><h2 className="font-bold">{notification.title || "Notification KORA"}</h2><p className="mt-1 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString("fr-FR")}</p></div>
                        {!(notification.is_read || notification.read_at) && <Badge className="bg-gold text-primary-foreground">Nouveau</Badge>}
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{notification.message || ""}</p>
                      {!(notification.is_read || notification.read_at) && <Button variant="ghost" size="sm" className="mt-3" onClick={() => markRead(notification)}><Check className="mr-2 h-4 w-4" /> Marquer comme lu</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
