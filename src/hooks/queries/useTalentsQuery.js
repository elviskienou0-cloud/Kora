import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import {
  buildPaginatedResult,
  getPaginationRange,
} from "@/lib/pagination"

export function useTalentsQuery({
  page = 1,
  pageSize = 20,
  search = "",
  status = "published",
  visibleOnly = true,
  categoryId = null,
  countryId = null,
  available = "all",
  verified = "all",
  minRate = null,
  maxRate = null,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: [
      "talents",
      {
        page,
        pageSize,
        search: String(search || "").trim(),
        status,
        visibleOnly,
        categoryId,
        countryId,
        available,
        verified,
        minRate,
        maxRate,
      },
    ],

    enabled: Boolean(enabled),

    placeholderData: (previousData) => previousData,

    staleTime: 30_000,

    queryFn: async () => {
      const {
        page: safePage,
        pageSize: safePageSize,
        from,
        to,
      } = getPaginationRange(page, pageSize)

      let query = supabase
        .from("talent_profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          title,
          bio,
          city,
          daily_rate,
          currency,
          rating,
          reviews_count,
          completed_projects,
          verified,
          available,
          category_id,
          country_id,
          managed_by,
          status,
          is_visible,
          created_at,
          updated_at
          `,
          { count: "exact" }
        )
        .order("updated_at", {
          ascending: false,
        })
        .range(from, to)

      /*
       * IMPORTANT
       * La RLS Supabase gère déjà la visibilité publique.
       *
       * On ne fait donc PAS :
       * .eq("is_visible", true)
       *
       * afin de ne pas exclure un talent dont is_visible serait NULL.
       */

      if (status && status !== "all") {
        query = query.eq("status", status)
      }

      if (categoryId) {
        query = query.eq(
          "category_id",
          categoryId
        )
      }

      if (countryId) {
        query = query.eq(
          "country_id",
          countryId
        )
      }

      if (
        available !== "all" &&
        available !== null &&
        available !== undefined
      ) {
        query = query.eq(
          "available",
          available === true ||
            available === "true"
        )
      }

      if (
        verified !== "all" &&
        verified !== null &&
        verified !== undefined
      ) {
        query = query.eq(
          "verified",
          verified === true ||
            verified === "true"
        )
      }

      if (
        minRate !== null &&
        minRate !== undefined &&
        minRate !== ""
      ) {
        const value = Number(minRate)

        if (Number.isFinite(value)) {
          query = query.gte(
            "daily_rate",
            value
          )
        }
      }

      if (
        maxRate !== null &&
        maxRate !== undefined &&
        maxRate !== ""
      ) {
        const value = Number(maxRate)

        if (Number.isFinite(value)) {
          query = query.lte(
            "daily_rate",
            value
          )
        }
      }

      const term = String(
        search || ""
      )
        .trim()
        .replace(/[%(),]/g, " ")

      if (term) {
        query = query.or(
          [
            `first_name.ilike.%${term}%`,
            `last_name.ilike.%${term}%`,
            `title.ilike.%${term}%`,
            `city.ilike.%${term}%`,
          ].join(",")
        )
      }

      const {
        data,
        error,
        count,
      } = await query

      if (error) {
        console.error(
          "Erreur useTalentsQuery :",
          error
        )

        throw error
      }

      /*
       * On enrichit ensuite uniquement les talents
       * de la page courante.
       */
      const rows = Array.isArray(data)
        ? data
        : []

      const categoryIds = [
        ...new Set(
          rows
            .map(
              (talent) =>
                talent.category_id
            )
            .filter(Boolean)
        ),
      ]

      const countryIds = [
        ...new Set(
          rows
            .map(
              (talent) =>
                talent.country_id
            )
            .filter(Boolean)
        ),
      ]

      const talentIds = rows
        .map(
          (talent) =>
            talent.id
        )
        .filter(Boolean)

      const [
        categoriesResult,
        countriesResult,
        skillsResult,
      ] = await Promise.all([
        categoryIds.length
          ? supabase
              .from("categories")
              .select(
                "id,slug,name"
              )
              .in(
                "id",
                categoryIds
              )
          : Promise.resolve({
              data: [],
              error: null,
            }),

        countryIds.length
          ? supabase
              .from("countries")
              .select(
                "id,name"
              )
              .in(
                "id",
                countryIds
              )
          : Promise.resolve({
              data: [],
              error: null,
            }),

        talentIds.length
          ? supabase
              .from("talent_profile_skills")
              .select(
                `
                talent_id,
                skills (
                  id,
                  name
                )
                `
              )
              .in(
                "talent_id",
                talentIds
              )
          : Promise.resolve({
              data: [],
              error: null,
            }),
      ])

      if (categoriesResult.error) {
        console.warn(
          "Catégories indisponibles :",
          categoriesResult.error
        )
      }

      if (countriesResult.error) {
        console.warn(
          "Pays indisponibles :",
          countriesResult.error
        )
      }

      if (skillsResult.error) {
        console.warn(
          "Compétences indisponibles :",
          skillsResult.error
        )
      }

      const categoryMap =
        Object.fromEntries(
          (
            categoriesResult.data ||
            []
          ).map((item) => [
            item.id,
            item,
          ])
        )

      const countryMap =
        Object.fromEntries(
          (
            countriesResult.data ||
            []
          ).map((item) => [
            item.id,
            item,
          ])
        )

      const skillsMap =
        new Map()

      for (const row of
        skillsResult.data || []) {
        if (!skillsMap.has(row.talent_id)) {
          skillsMap.set(
            row.talent_id,
            []
          )
        }

        if (row.skills) {
          skillsMap
            .get(row.talent_id)
            .push(row.skills)
        }
      }

      const enrichedRows = rows.map(
        (talent) => ({
          ...talent,

          categories:
            categoryMap[
              talent.category_id
            ] || null,

          countries:
            countryMap[
              talent.country_id
            ] || null,

          talent_profile_skills: (
            skillsMap.get(
              talent.id
            ) || []
          ).map((skill) => ({
            skills: skill,
          })),
        })
      )

      return buildPaginatedResult(
        enrichedRows,
        count || 0,
        safePage,
        safePageSize
      )
    },
  })
}

export default useTalentsQuery