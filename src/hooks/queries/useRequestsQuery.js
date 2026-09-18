import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import {
  getPaginationRange,
  buildPaginatedResult,
} from "@/lib/pagination"

export function useRequestsQuery({
  userId,
  role = "client",
  page = 1,
  pageSize = 20,
  status = null,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: [
      "requests",
      {
        userId,
        role,
        page,
        pageSize,
        status,
      },
    ],

    enabled: Boolean(enabled && userId),

    queryFn: async () => {
      const {
        page: safePage,
        pageSize: safePageSize,
        from,
        to,
      } = getPaginationRange(page, pageSize)

      let query = supabase
        .from("requests")
        .select(
          `
          id,
          client_id,
          manager_id,
          talent_id,
          project_id,
          title,
          description,
          budget,
          currency,
          status,
          created_at,
          updated_at
          `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to)

      if (role === "manager") {
        query = query.eq("manager_id", userId)
      } else {
        query = query.eq("client_id", userId)
      }

      if (status) {
        query = query.eq("status", status)
      }

      const {
        data,
        error,
        count,
      } = await query

      if (error) {
        throw error
      }

      return buildPaginatedResult(
        data || [],
        count || 0,
        safePage,
        safePageSize
      )
    },

    placeholderData: (previousData) => previousData,

    staleTime: 30_000,
  })
}

export default useRequestsQuery