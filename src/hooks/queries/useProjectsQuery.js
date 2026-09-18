import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import {
  buildPaginatedResult,
  getPaginationRange,
} from "@/lib/pagination"

export function useProjectsQuery({
  userId = null,
  role = null,
  page = 1,
  pageSize = 20,
  search = "",
  status = "all",
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: [
      "projects",
      {
        userId,
        role,
        page,
        pageSize,
        search: search.trim(),
        status,
      },
    ],
    enabled: enabled && Boolean(userId),

    queryFn: async () => {
      const { from, to } = getPaginationRange(page, pageSize)

      let query = supabase
        .from("projects")
        .select(
          "id, client_id, manager_id, title, description, budget_min, budget_max, currency, status, due_date, created_at, updated_at",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to)

      if (role === "client") {
        query = query.eq("client_id", userId)
      } else if (role === "manager") {
        query = query.eq("manager_id", userId)
      } else if (!role) {
        query = query.or(
          `client_id.eq.${userId},manager_id.eq.${userId}`
        )
      }

      if (status !== "all") {
        query = query.eq("status", status)
      }

      const term = search.trim()

      if (term) {
        query = query.ilike(
          "title",
          `%${term.replace(/[%_]/g, " ")}%`
        )
      }

      const { data, error, count } = await query

      if (error) throw error

      return buildPaginatedResult(data, count, page, pageSize)
    },
  })
}