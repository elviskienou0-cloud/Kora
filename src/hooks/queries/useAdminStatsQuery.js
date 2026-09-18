import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

function countOf(result) {
  return result?.count ?? 0
}

export function useAdminStatsQuery({
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: ["admin-stats"],
    enabled,
    staleTime: 15_000,

    queryFn: async () => {
      const [
        users,
        clients,
        managers,
        admins,
        talents,
        projects,
        requests,
        conversations,
        messages,
        notifications,
        subscriptions,
        payments,
        reviews,
        reports,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "client"),

        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "manager"),

        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "admin"),

        supabase
          .from("talent_profiles")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("projects")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("requests")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("conversations")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("messages")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("notifications")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("subscriptions")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("payments")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("reviews")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("reports")
          .select("id", {
            count: "exact",
            head: true,
          }),
      ])

      const essential = [
        users,
        clients,
        managers,
        admins,
        talents,
        projects,
        requests,
        conversations,
        messages,
        notifications,
        subscriptions,
        payments,
        reviews,
      ]

      const firstError = essential
        .map((result) => result.error)
        .find(Boolean)

      if (firstError) {
        throw firstError
      }

      return {
        users: countOf(users),
        clients: countOf(clients),
        managers: countOf(managers),
        admins: countOf(admins),
        talents: countOf(talents),
        projects: countOf(projects),
        requests: countOf(requests),
        conversations:
          countOf(conversations),
        messages: countOf(messages),
        notifications:
          countOf(notifications),
        subscriptions:
          countOf(subscriptions),
        payments: countOf(payments),
        reviews: countOf(reviews),

        reports: reports.error
          ? null
          : countOf(reports),
      }
    },
  })
}