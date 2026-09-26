import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { queryClient } from "@/lib/queryClient"
import { useNotificationsQuery } from "@/hooks/queries/useNotificationsQuery"
import { playNotificationSound } from "@/lib/notificationSound"

const PAGE_SIZE = 10

export default function ClientNotifications() {
  const { user } = useAuth()
  const userId = user?.authId || user?.id || null

  const [page, setPage] = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const {
    data: result,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useNotificationsQuery({
    userId,
    page,
    pageSize: PAGE_SIZE,
    unreadOnly,
    enabled: Boolean(userId),
  })

  const notifications = result?.data || []
  const total = Number(result?.count || 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrevious = page > 1
  const hasNext = page < totalPages

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`client-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const createdAt = payload?.new?.created_at ? new Date(payload.new.created_at).getTime() : 0
          const isRecent = createdAt > 0 && Date.now() - createdAt < 20_000

          if (payload?.eventType === "INSERT" && payload?.new?.user_id === userId && isRecent) {
            playNotificationSound()
          }

          queryClient.invalidateQueries({ queryKey: ["notifications"] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const unreadCountOnPage = useMemo(
    () => notifications.filter((item) => !item.is_read && !item.read_at).length,
    [notifications]
  )

  const markRead = async (notification) => {
    if (!notification?.id || notification.is_read || notification.read_at) return

    const readAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("id", notification.id)
      .eq("user_id", userId)

    if (updateError) {
      toast.error(updateError.message || "Impossible de marquer la notification comme lue.")
      return
    }

    queryClient.invalidateQueries({ queryKey: ["notifications"] })
  }

  const markAllVisibleAsRead = async () => {
    const unreadIds = notifications
      .filter((item) => !item.is_read && !item.read_at)
      .map((item) => item.id)
      .filter(Boolean)

    if (unreadIds.length === 0) return

    const readAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("user_id", userId)
      .in("id", unreadIds)

    if (updateError) {
      toast.error(updateError.message || "Impossible de marquer les notifications.")
      return
    }

    toast.success("Notifications marquées comme lues.")
    queryClient.invalidateQueries({ queryKey: ["notifications"] })
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Espace Client</p>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Suivez vos demandes, projets et mises à jour KORA.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={unreadOnly ? "default" : "outline"}
              onClick={() => {
                setUnreadOnly((current) => !current)
                setPage(1)
              }}
            >
              {unreadOnly ? "Toutes" : "Non lues"}
            </Button>
            <Button variant="outline" onClick={markAllVisibleAsRead} disabled={unreadCountOnPage === 0}>
              <Check className="mr-2 h-4 w-4" /> Tout lire
            </Button>
            <Button variant="outline" onClick={refresh} disabled={refreshing || isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing || isFetching ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="border-destructive/30">
            <CardContent className="p-6 text-sm text-destructive">
              {error.message || "Impossible de charger les notifications."}
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-gold" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="border-dashed border-gold/30">
            <CardContent className="py-20 text-center">
              <Bell className="mx-auto mb-3 h-9 w-9 text-gold" />
              <p className="font-semibold">Aucune notification</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {unreadOnly
                  ? "Vous n'avez aucune notification non lue."
                  : "Les notifications importantes apparaîtront ici."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const unread = !notification.is_read && !notification.read_at

              return (
                <Card
                  key={notification.id}
                  className={
                    unread
                      ? "border-gold/30 bg-gold/5"
                      : "border-border/60"
                  }
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                        <Bell className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="font-bold">{notification.title || "Notification KORA"}</h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(notification.created_at).toLocaleString("fr-FR")}
                            </p>
                          </div>
                          {unread && <Badge className="bg-gold text-primary-foreground">Nouveau</Badge>}
                        </div>

                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                          {notification.message || ""}
                        </p>

                        {unread && (
                          <Button variant="ghost" size="sm" className="mt-3" onClick={() => markRead(notification)}>
                            <Check className="mr-2 h-4 w-4" /> Marquer comme lu
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {totalPages} · {total} notification{total > 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrevious || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Précédente
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNext || isFetching}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Suivante <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}