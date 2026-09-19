import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

async function countRows(
  table,
  filters = {},
  options = {}
) {
  let query = supabase
    .from(table)
    .select("id", {
      count: "exact",
      head: true,
    })

  for (const [column, value] of Object.entries(filters)) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue
    }

    query = query.eq(column, value)
  }

  if (options.notSenderId) {
    query = query.neq(
      "sender_id",
      options.notSenderId
    )
  }

  if (options.readAtNull) {
    query = query.is("read_at", null)
  }

  const {
    count,
    error,
  } = await query

  if (error) {
    throw error
  }

  return count ?? 0
}

export function useAdminStatsQuery({
  userId = null,
  role = "admin",
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: [
      "admin-stats",
      {
        userId,
        role,
      },
    ],

    enabled: Boolean(
      enabled && role === "admin"
    ),

    queryFn: async () => {
      /*
       * On récupère directement l'utilisateur Supabase.
       * Cela évite qu'un problème éventuel dans l'objet
       * user d'AuthContext bloque les statistiques.
       */
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      const currentUserId =
        authData?.user?.id || userId

      if (!currentUserId) {
        throw new Error(
          "Utilisateur administrateur introuvable."
        )
      }

      const [
        users,
        clients,
        managers,
        admins,
        suspendedUsers,

        talents,
        publishedTalents,
        pendingTalents,

        projects,
        openProjects,
        activeProjects,
        completedProjects,

        requests,
        pendingRequests,
        acceptedRequests,
        rejectedRequests,

        conversations,

        messages,
        unreadMessages,

        reports,
        pendingReports,

        subscriptions,
        activeSubscriptions,
        expiredSubscriptions,

        payments,
        pendingPayments,
        paidPayments,
        failedPayments,
      ] = await Promise.all([
        // =========================
        // UTILISATEURS
        // =========================

        countRows("profiles"),

        countRows("profiles", {
          role: "client",
        }),

        countRows("profiles", {
          role: "manager",
        }),

        countRows("profiles", {
          role: "admin",
        }),

        countRows("profiles", {
          is_suspended: true,
        }),

        // =========================
        // TALENTS
        // =========================

        countRows("talent_profiles"),

        countRows("talent_profiles", {
          status: "published",
        }),

        countRows("talent_profiles", {
          status: "pending",
        }),

        // =========================
        // PROJETS
        // =========================

        countRows("projects"),

        countRows("projects", {
          status: "open",
        }),

        countRows("projects", {
          status: "active",
        }),

        countRows("projects", {
          status: "completed",
        }),

        // =========================
        // DEMANDES
        // =========================

        countRows("requests"),

        countRows("requests", {
          status: "pending",
        }),

        countRows("requests", {
          status: "accepted",
        }),

        countRows("requests", {
          status: "rejected",
        }),

        // =========================
        // CONVERSATIONS
        // =========================

        countRows("conversations"),

        // =========================
        // MESSAGES
        // =========================

        countRows("messages"),

        /*
         * IMPORTANT :
         * messages utilise read_at,
         * pas is_read.
         */
        countRows(
          "messages",
          {},
          {
            notSenderId: currentUserId,
            readAtNull: true,
          }
        ),

        // =========================
        // SIGNALEMENTS
        // =========================

        countRows("reports"),

        countRows("reports", {
          status: "pending",
        }),

        // =========================
        // ABONNEMENTS
        // =========================

        countRows("subscriptions"),

        countRows("subscriptions", {
          status: "active",
        }),

        countRows("subscriptions", {
          status: "expired",
        }),

        // =========================
        // PAIEMENTS
        // =========================

        countRows("payments"),

        countRows("payments", {
          status: "pending",
        }),

        countRows("payments", {
          status: "paid",
        }),

        countRows("payments", {
          status: "failed",
        }),
      ])

      return {
        users,
        clients,
        managers,
        admins,
        suspendedUsers,

        talents,
        publishedTalents,
        pendingTalents,

        projects,
        openProjects,
        activeProjects,
        completedProjects,

        requests,
        pendingRequests,
        acceptedRequests,
        rejectedRequests,

        conversations,

        messages,
        unreadMessages,

        reports,
        pendingReports,

        subscriptions,
        activeSubscriptions,
        expiredSubscriptions,

        payments,
        pendingPayments,
        paidPayments,
        failedPayments,

        generatedAt:
          new Date().toISOString(),
      }
    },

    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

export default useAdminStatsQuery