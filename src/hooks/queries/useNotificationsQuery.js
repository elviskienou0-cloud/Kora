import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import {
  buildPaginatedResult,
  getPaginationRange,
} from "@/lib/pagination"

export function useNotificationsQuery({
  userId = null,
  page = 1,
  pageSize = 20,
  unreadOnly = false,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: [
      "notifications",
      {
        userId,
        page,
        pageSize,
        unreadOnly,
      },
    ],

    enabled:
      enabled && Boolean(userId),

    queryFn: async () => {
      const { from, to } =
        getPaginationRange(
          page,
          pageSize
        )

      let query = supabase
        .from("notifications")
        .select(
          "id, user_id, type, title, message, data, is_read, read_at, created_at",
          { count: "exact" }
        )
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        })
        .range(from, to)

      if (unreadOnly) {
        query = query.eq(
          "is_read",
          false
        )
      }

      const {
        data,
        error,
        count,
      } = await query

      if (error) throw error

      return buildPaginatedResult(
        data,
        count,
        page,
        pageSize
      )
    },
  })
}