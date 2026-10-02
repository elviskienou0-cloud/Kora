import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import {
  buildPaginatedResult,
  getPaginationRange,
} from "@/lib/pagination"

export function useConversationsQuery({
  userId = null,
  page = 1,
  pageSize = 20,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: [
      "conversations",
      {
        userId,
        page,
        pageSize,
      },
    ],
    enabled: enabled && Boolean(userId),

    queryFn: async () => {
      const { from, to } = getPaginationRange(page, pageSize)

      const {
        data: participantRows,
        error: participantError,
        count,
      } = await supabase
        .from("conversation_participants")
        .select("conversation_id", { count: "exact" })
        .eq("user_id", userId)
        .range(from, to)

      if (participantError) throw participantError

      const conversationIds = [
        ...new Set(
          (participantRows || [])
            .map((row) => row.conversation_id)
            .filter(Boolean)
        ),
      ]

      if (!conversationIds.length) {
        return buildPaginatedResult(
          [],
          count,
          page,
          pageSize
        )
      }

      const [
        { data: conversations, error: conversationsError },
        { data: participants, error: participantsError },
      ] = await Promise.all([
        supabase
          .from("conversations")
          .select("id, title, created_at")
          .in("id", conversationIds),

        supabase
          .from("conversation_participants")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds),
      ])

      if (conversationsError) throw conversationsError
      if (participantsError) throw participantsError

      const otherUserByConversation = new Map()

      for (const row of participants || []) {
        if (
          row.user_id !== userId &&
          !otherUserByConversation.has(
            row.conversation_id
          )
        ) {
          otherUserByConversation.set(
            row.conversation_id,
            row.user_id
          )
        }
      }

      const otherUserIds = [
        ...new Set(
          [...otherUserByConversation.values()].filter(Boolean)
        ),
      ]

      let profiles = []

      if (otherUserIds.length) {
        const {
          data,
          error,
        } = await supabase
          .from("profiles")
          .select("id, name, avatar, role")
          .in("id", otherUserIds)

        if (error) throw error

        profiles = data || []
      }

      const conversationById = new Map(
        (conversations || []).map((item) => [
          item.id,
          item,
        ])
      )

      const profileById = new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ])
      )

      const summaries = await Promise.all(
        conversationIds.map(async (conversationId) => {
          const [
            {
              data: latestMessage,
              error: latestError,
            },
            {
              count: unreadCount,
              error: unreadError,
            },
          ] = await Promise.all([
            supabase
              .from("messages")
              .select(
                "id, conversation_id, sender_id, body, read_at, created_at"
              )
              .eq(
                "conversation_id",
                conversationId
              )
              .order("created_at", {
                ascending: false,
              })
              .limit(1)
              .maybeSingle(),

            supabase
              .from("messages")
              .select("id", {
                count: "exact",
                head: true,
              })
              .eq(
                "conversation_id",
                conversationId
              )
              .neq("sender_id", userId)
              .is("read_at", null),
          ])

          if (latestError) throw latestError
          if (unreadError) throw unreadError

          return {
            conversationId,
            latestMessage:
              latestMessage || null,
            unreadCount:
              unreadCount || 0,
          }
        })
      )

      const summaryByConversation =
        new Map(
          summaries.map((item) => [
            item.conversationId,
            item,
          ])
        )

      const items = conversationIds.map(
        (conversationId) => {
          const participantId =
            otherUserByConversation.get(
              conversationId
            ) || null

          const profile = participantId
            ? profileById.get(participantId) || null
            : null

          const summary =
            summaryByConversation.get(
              conversationId
            )

          const conversation =
            conversationById.get(
              conversationId
            )

          return {
            id: conversationId,
            title:
              conversation?.title ||
              null,
            created_at:
              conversation?.created_at ||
              null,
            participantId,
            participant: profile,
            latestMessage:
              summary?.latestMessage ||
              null,
            unreadCount:
              summary?.unreadCount ||
              0,
          }
        }
      )

      items.sort((a, b) => {
        const aTime = new Date(
          a.latestMessage?.created_at ||
            a.created_at ||
            0
        ).getTime()

        const bTime = new Date(
          b.latestMessage?.created_at ||
            b.created_at ||
            0
        ).getTime()

        return bTime - aTime
      })

      return buildPaginatedResult(
        items,
        count,
        page,
        pageSize
      )
    },
  })
}

export function useMessagesQuery({
  conversationId,
  page = 1,
  pageSize = 50,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: [
      "messages",
      {
        conversationId,
        page,
        pageSize,
      },
    ],

    enabled:
      enabled && Boolean(conversationId),

    queryFn: async () => {
      const { from, to } =
        getPaginationRange(
          page,
          pageSize
        )

      const {
        data,
        error,
        count,
      } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, body, read_at, created_at",
          { count: "exact" }
        )
        .eq(
          "conversation_id",
          conversationId
        )
        .order("created_at", {
          ascending: false,
        })
        .range(from, to)

      if (error) throw error

      const result =
        buildPaginatedResult(
          data,
          count,
          page,
          pageSize
        )

      return {
        ...result,
        data: [...result.data].reverse(),
      }
    },
  })
}