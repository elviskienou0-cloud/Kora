import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ArrowLeft,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  User,
  Wifi,
  WifiOff,
} from "lucide-react"
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom"
import { toast } from "sonner"

import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { markMessagesRead } from "@/lib/messaging"
import { queryClient } from "@/lib/queryClient"

import {
  useConversationsQuery,
  useMessagesQuery,
} from "@/hooks/queries/useMessagesQuery"

const CONVERSATIONS_PAGE_SIZE = 20
const MESSAGES_PAGE_SIZE = 50

function getProfileName(profile) {
  if (!profile) return "Discussion"

  return (
    profile.name ||
    [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Discussion"
  )
}

function getConversationTitle(conversation) {
  if (!conversation) return "Conversation"

  return (
    conversation.title ||
    getProfileName(conversation.profile) ||
    "Conversation"
  )
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return "D"

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function formatMessageTime(value) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatConversationTime(value) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  })
}

export default function Messages() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const conversationId =
    searchParams.get("conversation")

  const { user, isAuthenticated } =
    useAuth()

  const authUserId =
    user?.authId || user?.id

  const messagesEndRef =
    useRef(null)

  const [conversationPage, setConversationPage] =
    useState(1)

  const [messagePage, setMessagePage] =
    useState(1)

  const [messageText, setMessageText] =
    useState("")

  const [sending, setSending] =
    useState(false)

  const [refreshing, setRefreshing] =
    useState(false)

  const [online, setOnline] =
    useState(() =>
      typeof navigator === "undefined"
        ? true
        : navigator.onLine
    )

  const [realtimeStatus, setRealtimeStatus] =
    useState("CONNECTING")

  const {
    data: conversationsPageData,
    isLoading: loadingConversations,
    isFetching: fetchingConversations,
    error: conversationsError,
  } = useConversationsQuery({
    userId: authUserId,
    page: conversationPage,
    pageSize: CONVERSATIONS_PAGE_SIZE,
    enabled: Boolean(
      isAuthenticated &&
      authUserId
    ),
  })

  const {
    data: messagesPageData,
    isLoading: loadingMessages,
    isFetching: fetchingMessages,
    error: messagesError,
  } = useMessagesQuery({
    conversationId,
    page: messagePage,
    pageSize: MESSAGES_PAGE_SIZE,
    enabled: Boolean(
      isAuthenticated &&
      authUserId &&
      conversationId
    ),
  })

  const conversations =
    conversationsPageData?.data || []

  const conversationTotalPages =
    conversationsPageData?.totalPages || 1

  const messages =
    messagesPageData?.data || []

  const messageTotalPages =
    messagesPageData?.totalPages || 1

  const currentConversation = useMemo(
    () =>
      conversations.find(
        (item) =>
          item.id === conversationId
      ) || null,
    [
      conversations,
      conversationId,
    ]
  )

  const conversationTitle =
    getConversationTitle(
      currentConversation
    )

  useEffect(() => {
    setMessagePage(1)
  }, [conversationId])

  useEffect(() => {
    if (
      messagePage >
      messageTotalPages
    ) {
      setMessagePage(
        messageTotalPages
      )
    }
  }, [
    messagePage,
    messageTotalPages,
  ])

  useEffect(() => {
    if (
      conversationPage >
      conversationTotalPages
    ) {
      setConversationPage(
        conversationTotalPages
      )
    }
  }, [
    conversationPage,
    conversationTotalPages,
  ])

  useEffect(() => {
    const handleOnline = () =>
      setOnline(true)

    const handleOffline = () =>
      setOnline(false)

    window.addEventListener(
      "online",
      handleOnline
    )

    window.addEventListener(
      "offline",
      handleOffline
    )

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      )

      window.removeEventListener(
        "offline",
        handleOffline
      )
    }
  }, [])

  useEffect(() => {
    if (!authUserId) return

    const channel =
      supabase
        .channel(
          `kora-user-messages-${authUserId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const affectedConversation =
              payload.new?.conversation_id ||
              payload.old?.conversation_id

            if (
              conversationId &&
              affectedConversation ===
                conversationId
            ) {
              queryClient.invalidateQueries({
                queryKey: [
                  "messages",
                  conversationId,
                ],
              })
            }

            queryClient.invalidateQueries({
              queryKey: ["conversations"],
            })
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversation_participants",
            filter: `user_id=eq.${authUserId}`,
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["conversations"],
            })
          }
        )
        .subscribe((status) => {
          setRealtimeStatus(status)
        })

    return () => {
      supabase.removeChannel(
        channel
      )
    }
  }, [
    authUserId,
    conversationId,
  ])

  const scrollToBottom = () => {
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      })
    })
  }

  useEffect(() => {
    if (!conversationId || !messages.length) {
      return
    }

    scrollToBottom()
  }, [
    conversationId,
    messages.length,
  ])

  useEffect(() => {
    if (!conversationId || !authUserId) {
      return
    }

    markMessagesRead(
      conversationId
    )
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["conversations"],
        })
      })
      .catch((error) => {
        console.warn(
          "Impossible de marquer les messages comme lus :",
          error
        )
      })
  }, [
    conversationId,
    authUserId,
  ])

  const handleRefresh =
    async () => {
      setRefreshing(true)

      try {
        await queryClient.invalidateQueries({
          queryKey: ["conversations"],
        })

        if (conversationId) {
          await queryClient.invalidateQueries({
            queryKey: [
              "messages",
              conversationId,
            ],
          })
        }
      } finally {
        setRefreshing(false)
      }
    }

  const handleSend = async () => {
    const body =
      messageText.trim()

    if (
      !body ||
      !conversationId ||
      !authUserId ||
      sending ||
      !online
    ) {
      return
    }

    if (body.length > 4000) {
      toast.error(
        "Le message ne peut pas dépasser 4000 caractères."
      )
      return
    }

    setSending(true)

    try {
      const {
        data,
        error,
      } = await supabase
        .from("messages")
        .insert({
          conversation_id:
            conversationId,
          sender_id:
            authUserId,
          body,
        })
        .select(
          "id, conversation_id, sender_id, body, read_at, created_at"
        )
        .single()

      if (error) {
        throw error
      }

      /*
       * On invalide plutôt que de conserver
       * plusieurs sources locales concurrentes.
       */
      await queryClient.invalidateQueries({
        queryKey: [
          "messages",
          conversationId,
        ],
      })

      await queryClient.invalidateQueries({
        queryKey: ["conversations"],
      })

      setMessageText("")
      scrollToBottom()

      return data
    } catch (error) {
      console.error(
        "Erreur envoi message :",
        error
      )

      toast.error(
        error?.message ||
          "Impossible d'envoyer le message."
      )
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()
      handleSend()
    }
  }

  if (
    !isAuthenticated ||
    !authUserId
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border bg-background p-8 text-center">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

          <h1 className="text-xl font-bold">
            Connexion requise
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous pour accéder à vos messages.
          </p>
        </div>
      </div>
    )
  }

  /*
   * ============================================================
   * LISTE DES CONVERSATIONS
   * ============================================================
   */
  if (!conversationId) {
    return (
      <div className="min-h-[70vh] bg-background p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                KORA
              </p>

              <h1 className="text-2xl font-black">
                Messages
              </h1>

              <p className="text-sm text-muted-foreground">
                Vos conversations avec les membres de KORA.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw
                className={
                  refreshing ||
                  fetchingConversations
                    ? "h-4 w-4 animate-spin"
                    : "h-4 w-4"
                }
              />

              Actualiser
            </button>
          </div>

          {!online && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <WifiOff className="h-4 w-4" />
              Vous êtes hors connexion.
            </div>
          )}

          {conversationsError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600">
              {conversationsError.message ||
                "Impossible de charger vos conversations."}
            </div>
          )}

          {loadingConversations ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-gold" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-16 text-center">
              <MessageCircle className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

              <h2 className="font-bold">
                Aucune conversation
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Utilisez « Contacter » sur une fiche Talent ou depuis une demande pour démarrer une discussion.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border bg-background">
                {conversations.map(
                  (conversation) => {
                    const title =
                      getConversationTitle(
                        conversation
                      )

                    return (
                      <button
                        key={
                          conversation.id
                        }
                        type="button"
                        onClick={() => {
                          setMessagePage(1)

                          navigate(
                            `/messages?conversation=${conversation.id}`
                          )
                        }}
                        className="flex w-full items-center gap-4 border-b px-5 py-4 text-left last:border-b-0 hover:bg-accent/40"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-bold text-foreground">
                          {conversation.avatar ? (
                            <img
                              src={
                                conversation.avatar
                              }
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(
                              title
                            )
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-bold">
                              {title}
                            </p>

                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatConversationTime(
                                conversation
                                  .latestMessage
                                  ?.created_at
                              )}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="truncate text-sm text-muted-foreground">
                              {conversation
                                .latestMessage
                                ?.body ||
                                "Aucun message"}
                            </p>

                            {conversation.unreadCount >
                              0 && (
                              <span className="min-w-6 rounded-full bg-foreground px-2 py-0.5 text-center text-xs font-bold text-background">
                                {conversation.unreadCount >
                                99
                                  ? "99+"
                                  : conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  }
                )}
              </div>

              {conversationTotalPages >
                1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">
                    Page{" "}
                    <strong className="text-foreground">
                      {conversationPage}
                    </strong>{" "}
                    sur{" "}
                    <strong className="text-foreground">
                      {conversationTotalPages}
                    </strong>
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={
                        conversationPage <=
                          1 ||
                        fetchingConversations
                      }
                      onClick={() =>
                        setConversationPage(
                          (value) =>
                            Math.max(
                              1,
                              value - 1
                            )
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </button>

                    <button
                      type="button"
                      disabled={
                        conversationPage >=
                          conversationTotalPages ||
                        fetchingConversations
                      }
                      onClick={() =>
                        setConversationPage(
                          (value) =>
                            Math.min(
                              conversationTotalPages,
                              value + 1
                            )
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm disabled:opacity-40"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  /*
   * ============================================================
   * CONVERSATION ACTIVE
   * ============================================================
   */
  return (
    <div className="min-h-[70vh] bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="flex items-center gap-3 border-b px-4 py-4 md:px-6">
            <button
              type="button"
              onClick={() =>
                navigate("/messages")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border hover:bg-accent"
              aria-label="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-accent font-bold text-foreground">
              {currentConversation?.avatar ? (
                <img
                  src={
                    currentConversation.avatar
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(
                  conversationTitle
                )
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {conversationTitle}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {online ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                    En ligne
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                    Hors connexion
                  </>
                )}

                {realtimeStatus ===
                  "SUBSCRIBED" && (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Temps réel
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={refreshing}
              className="rounded-xl border p-2 hover:bg-accent disabled:opacity-50"
              aria-label="Actualiser"
            >
              <RefreshCw
                className={
                  refreshing ||
                  fetchingMessages
                    ? "h-4 w-4 animate-spin"
                    : "h-4 w-4"
                }
              />
            </button>
          </div>

          {messagesError && (
            <div className="border-b border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
              {messagesError.message ||
                "Impossible de charger les messages."}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {loadingMessages ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-gold" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[40vh] items-center justify-center text-center">
                <div>
                  <MessageCircle className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

                  <p className="font-semibold">
                    Aucun message
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Envoyez le premier message.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(
                  (message) => {
                    const mine =
                      message.sender_id ===
                      authUserId

                    return (
                      <div
                        key={
                          message.id
                        }
                        className={`flex ${
                          mine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex max-w-[82%] flex-col ${
                            mine
                              ? "items-end"
                              : "items-start"
                          }`}
                        >
                          <div
                            className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm ${
                              mine
                                ? "rounded-br-md bg-foreground text-background"
                                : "rounded-bl-md bg-muted text-foreground"
                            }`}
                          >
                            {
                              message.body
                            }
                          </div>

                          <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                            <span>
                              {formatMessageTime(
                                message.created_at
                              )}
                            </span>

                            {mine &&
                              message.read_at && (
                                <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {messageTotalPages >
            1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Page{" "}
                <strong className="text-foreground">
                  {messagePage}
                </strong>{" "}
                sur{" "}
                <strong className="text-foreground">
                  {messageTotalPages}
                </strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    messagePage <=
                      1 ||
                    fetchingMessages
                  }
                  onClick={() =>
                    setMessagePage(
                      (value) =>
                        Math.max(
                          1,
                          value - 1
                        )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Plus récent
                </button>

                <button
                  type="button"
                  disabled={
                    messagePage >=
                      messageTotalPages ||
                    fetchingMessages
                  }
                  onClick={() =>
                    setMessagePage(
                      (value) =>
                        Math.min(
                          messageTotalPages,
                          value + 1
                        )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs disabled:opacity-40"
                >
                  Plus ancien
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {!online && (
            <div className="border-t bg-amber-50 px-4 py-2 text-xs text-amber-800">
              Hors connexion : l'envoi des messages est désactivé.
            </div>
          )}

          <div className="border-t p-4">
            <div className="flex items-end gap-3">
              <textarea
                value={
                  messageText
                }
                onChange={(event) =>
                  setMessageText(
                    event.target
                      .value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                rows={2}
                maxLength={4000}
                disabled={
                  sending ||
                  !online
                }
                placeholder={
                  online
                    ? "Écrire un message…"
                    : "Hors connexion…"
                }
                className="min-h-12 flex-1 resize-none rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="button"
                onClick={
                  handleSend
                }
                disabled={
                  sending ||
                  !online ||
                  !messageText.trim()
                }
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Envoyer"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>

            <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Entrée pour envoyer · Shift + Entrée pour une nouvelle ligne
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
