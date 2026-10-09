import {
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  motion,
  AnimatePresence,
} from "framer-motion"
import { toast } from "sonner"
import {
  Search,
  Heart,
  Send,
  Star,
  MapPin,
  Briefcase,
  Filter,
  X,
  CheckCircle2,
  Eye,
  Users,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  useNavigate,
} from "react-router-dom"
import { useI18n } from "@/i18n/kora-i18n.jsx"

import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { getCategoryIcon } from "@/lib/categoryIcons"
import {
  useTalentsQuery,
} from "@/hooks/queries/useTalentsQuery"

function formatMoney(value, currency, language = "fr") {
  return new Intl.NumberFormat(language === "en" ? "en-GB" : "fr-FR", {
    style: "currency",
    currency: currency || "XOF",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

const ALL_COUNTRIES_LABEL = "all"

/*
 * IMPORTANT :
 * Le talent KORA actuellement présent peut dépasser 500 000 XOF.
 * On garde donc un plafond de secours suffisamment haut pendant
 * que le vrai maximum est récupéré depuis Supabase.
 */
const DEFAULT_RATE_CEILING = 5_000_000
const RATE_STEP = 5_000
const PAGE_SIZE = 20

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
}

export default function ClientBrowse() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, language } = useI18n()

  const authUserId =
    user?.authId || user?.id

  const [categoryOptions, setCategoryOptions] =
    useState([])

  const [countryOptions, setCountryOptions] =
    useState([
      {
        id: "all",
        name: ALL_COUNTRIES_LABEL,
      },
    ])

  const [favorites, setFavorites] =
    useState(new Set())

  const [page, setPage] =
    useState(1)

  const [search, setSearch] =
    useState("")

  const [selectedCategory, setSelectedCategory] =
    useState("all")

  const [selectedCountry, setSelectedCountry] =
    useState("all")

  const [minRate, setMinRate] =
    useState(0)

  const [rateCeiling, setRateCeiling] =
    useState(DEFAULT_RATE_CEILING)

  const [maxRate, setMaxRate] =
    useState(DEFAULT_RATE_CEILING)

  const [availableOnly, setAvailableOnly] =
    useState(false)

  const [verifiedOnly, setVerifiedOnly] =
    useState(false)

  const [showFilters, setShowFilters] =
    useState(false)

  const [sortBy, setSortBy] =
    useState("recommended")

  const [loadError, setLoadError] =
    useState("")

  /*
   * ============================================================
   * REACT QUERY — TALENTS
   * ============================================================
   */
  const {
    data: talentPage,
    isLoading: talentsLoading,
    isFetching: talentsFetching,
    error: talentsError,
  } = useTalentsQuery({
    page,
    pageSize: PAGE_SIZE,
    search,
    status: "published",
    visibleOnly: true,
    categoryId:
      selectedCategory === "all"
        ? null
        : selectedCategory,
    countryId:
      selectedCountry === "all"
        ? null
        : selectedCountry,
    available:
      availableOnly
        ? true
        : "all",
    verified:
      verifiedOnly
        ? true
        : "all",
    minRate:
      minRate > 0
        ? minRate
        : null,
    /*
     * Ne jamais appliquer un plafond de 500 000 XOF
     * par défaut : cela supprimait le talent à 992 500 XOF.
     */
    maxRate:
      maxRate < rateCeiling
        ? maxRate
        : null,
    enabled: true,
  })

  const talents =
    talentPage?.data || []

  const totalTalents =
    Number(talentPage?.count) || 0

  const totalPages =
    talentPage?.totalPages || 1

  /*
   * ============================================================
   * NORMALISATION
   * ============================================================
   */
  const normalizedTalents = useMemo(
    () =>
      talents.map((talent) => ({
        id: talent.id,

        firstName:
          talent.first_name || "",

        lastName:
          talent.last_name || "",

        categoryId:
          talent.category_id ||
          talent.categories?.id ||
          null,

        categorySlug:
          talent.categories?.slug ||
          null,

        categoryName:
          talent.categories?.name ||
          "",

        countryId:
          talent.country_id ||
          talent.countries?.id ||
          null,

        country:
          talent.countries?.name ||
          "",

        city:
          talent.city || "",

        rating:
          Number(talent.rating) || 0,

        reviews:
          Number(talent.reviews_count) || 0,

        completedProjects:
          Number(talent.completed_projects) ||
          0,

        rate:
          Number(talent.daily_rate) || 0,

        currency:
          talent.currency || "XOF",

        title:
          talent.title || "",

        bio:
          talent.bio || "",

        skills:
          (
            talent.talent_profile_skills ||
            []
          )
            .map(
              (row) =>
                row.skills?.name
            )
            .filter(Boolean),

        verified:
          Boolean(talent.verified),

        available:
          Boolean(talent.available),
      })),
    [talents]
  )

  /*
   * ============================================================
   * TRI LOCAL
   * ============================================================
   */
  const visibleTalents = useMemo(() => {
    const result = [
      ...normalizedTalents,
    ]

    switch (sortBy) {
      case "rating":
        result.sort(
          (a, b) =>
            b.rating - a.rating
        )
        break

      case "projects":
        result.sort(
          (a, b) =>
            b.completedProjects -
            a.completedProjects
        )
        break

      case "rate-asc":
        result.sort(
          (a, b) =>
            a.rate - b.rate
        )
        break

      case "rate-desc":
        result.sort(
          (a, b) =>
            b.rate - a.rate
        )
        break

      default:
        result.sort(
          (a, b) =>
            b.reviews * b.rating -
            a.reviews * a.rating
        )
        break
    }

    return result
  }, [
    normalizedTalents,
    sortBy,
  ])

  /*
   * ============================================================
   * MÉTADONNÉES + FAVORIS
   * ============================================================
   */
  useEffect(() => {
    if (!authUserId) {
      return
    }

    let mounted = true

    async function loadBrowseMeta() {
      setLoadError("")

      try {
        const [
          categoriesResult,
          countriesResult,
          favoritesResult,
        ] = await Promise.all([
          supabase
            .from("categories")
            .select("id, slug, name")
            .order("name"),

          supabase
            .from("countries")
            .select("id, name")
            .order("name"),

          supabase
            .from("favorites")
            .select("talent_id")
            .eq(
              "client_id",
              authUserId
            ),
        ])

        if (categoriesResult.error) {
          throw categoriesResult.error
        }

        if (countriesResult.error) {
          throw countriesResult.error
        }

        if (favoritesResult.error) {
          throw favoritesResult.error
        }

        if (!mounted) return

        setCategoryOptions([
          {
            id: "all",
            label: "Toutes",
            icon: Users,
          },
          ...(categoriesResult.data || [])
            .map((category) => ({
              id: category.id,
              label: category.name,
              icon: getCategoryIcon(
                category.slug
              ),
            })),
        ])

        setCountryOptions([
          {
            id: "all",
            name: ALL_COUNTRIES_LABEL,
          },
          ...(countriesResult.data || []),
        ])

        setFavorites(
          new Set(
            (favoritesResult.data || [])
              .map(
                (row) =>
                  row.talent_id
              )
              .filter(Boolean)
          )
        )
      } catch (error) {
        console.error(
          "Erreur chargement catalogue KORA :",
          error
        )

        if (mounted) {
          setLoadError(
            error?.message ||
              t("errors.loading")
          )
        }
      }
    }

    loadBrowseMeta()

    return () => {
      mounted = false
    }
  }, [authUserId])

  /*
   * ============================================================
   * PLAFOND TARIFAIRE GLOBAL
   * ============================================================
   *
   * IMPORTANT :
   * On ne calcule PAS le plafond à partir de la page courante.
   * Sinon un talent cher situé sur une autre page peut être exclu.
   *
   * On récupère uniquement le tarif maximum depuis Supabase.
   * Cela ne charge pas tous les talents.
   * ============================================================
   */
  useEffect(() => {
    let mounted = true

    async function loadRateCeiling() {
      const {
        data,
        error,
      } = await supabase
        .from("talent_profiles")
        .select("daily_rate")
        .eq("status", "published")
        .order("daily_rate", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn(
          t("browse.maxRateError"),
          error
        )
        return
      }

      if (!mounted) return

      const highestRate =
        Number(data?.daily_rate) || 0

      const calculatedCeiling =
        highestRate > 0
          ? Math.max(
              DEFAULT_RATE_CEILING,
              Math.ceil(
                highestRate / RATE_STEP
              ) * RATE_STEP
            )
          : DEFAULT_RATE_CEILING

      setRateCeiling(
        calculatedCeiling
      )

      setMaxRate(
        (current) => {
          /*
           * Si le curseur est encore sur l'ancien
           * plafond, on le replace sur le nouveau plafond.
           */
          if (
            current >=
            DEFAULT_RATE_CEILING
          ) {
            return calculatedCeiling
          }

          return Math.min(
            current,
            calculatedCeiling
          )
        }
      )
    }

    loadRateCeiling()

    return () => {
      mounted = false
    }
  }, [])

  /*
   * ============================================================
   * RECHERCHE FINE SUR LA PAGE COURANTE
   * ============================================================
   */
  const filteredTalents = useMemo(() => {
    const term =
      search
        .trim()
        .toLowerCase()

    if (!term) {
      return visibleTalents
    }

    return visibleTalents.filter(
      (talent) =>
        talent.firstName
          .toLowerCase()
          .includes(term) ||
        talent.lastName
          .toLowerCase()
          .includes(term) ||
        talent.title
          .toLowerCase()
          .includes(term) ||
        talent.city
          .toLowerCase()
          .includes(term) ||
        talent.skills.some(
          (skill) =>
            skill
              .toLowerCase()
              .includes(term)
        )
    )
  }, [
    visibleTalents,
    search,
  ])

  /*
   * ============================================================
   * FAVORIS
   * ============================================================
   */
  const toggleFavorite = async (
    talentId
  ) => {
    if (!authUserId) {
      return
    }

    const wasFavorite =
      favorites.has(talentId)

    setFavorites((current) => {
      const next =
        new Set(current)

      if (wasFavorite) {
        next.delete(talentId)
      } else {
        next.add(talentId)
      }

      return next
    })

    try {
      if (wasFavorite) {
        const {
          error,
        } = await supabase
          .from("favorites")
          .delete()
          .eq(
            "client_id",
            authUserId
          )
          .eq(
            "talent_id",
            talentId
          )

        if (error) {
          throw error
        }
      } else {
        const {
          error,
        } = await supabase
          .from("favorites")
          .insert({
            client_id:
              authUserId,
            talent_id:
              talentId,
          })

        if (error) {
          throw error
        }
      }
    } catch (error) {
      console.error(
        "Erreur favori :",
        error
      )

      toast.error(
        t("browse.favoriteError")
      )

      setFavorites((current) => {
        const next =
          new Set(current)

        if (wasFavorite) {
          next.add(talentId)
        } else {
          next.delete(talentId)
        }

        return next
      })
    }
  }

  /*
   * ============================================================
   * FILTRES
   * ============================================================
   */
  const activeFiltersCount =
    (selectedCategory !==
    "all"
      ? 1
      : 0) +
    (selectedCountry !==
    "all"
      ? 1
      : 0) +
    (minRate > 0
      ? 1
      : 0) +
    (maxRate < rateCeiling
      ? 1
      : 0) +
    (availableOnly
      ? 1
      : 0) +
    (verifiedOnly
      ? 1
      : 0)

  const resetFilters = () => {
    setSelectedCategory(
      "all"
    )

    setSelectedCountry(
      "all"
    )

    setMinRate(0)

    setMaxRate(
      rateCeiling
    )

    setAvailableOnly(
      false
    )

    setVerifiedOnly(
      false
    )

    setSearch("")

    setPage(1)
  }

  const handleCategoryChange = (
    value
  ) => {
    setSelectedCategory(value)
    setPage(1)
  }

  const handleCountryChange = (
    value
  ) => {
    setSelectedCountry(value)
    setPage(1)
  }

  useEffect(() => {
    if (!authUserId) return undefined

    const term = search.trim()
    if (term.length < 2) return undefined

    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from("activity_logs").insert({
        user_id: authUserId,
        action: "search_talents",
        entity_type: "talent_search",
        metadata: { query_length: term.length },
      })

      if (error) {
        console.warn("Impossible d'enregistrer la recherche KORA :", error)
      }
    }, 700)

    return () => window.clearTimeout(timer)
  }, [authUserId, search])

  const handleSearchChange = (
    event
  ) => {
    setSearch(
      event.target.value
    )
    setPage(1)
  }

  const handleMinRateChange = (
    event
  ) => {
    const value =
      Number(event.target.value) ||
      0

    setMinRate(
      Math.min(
        value,
        rateCeiling
      )
    )

    setPage(1)
  }

  const handleMaxRateChange = (
    event
  ) => {
    const value =
      Number(event.target.value) ||
      0

    setMaxRate(
      Math.min(
        Math.max(
          value,
          minRate
        ),
        rateCeiling
      )
    )

    setPage(1)
  }

  const goToPreviousPage = () => {
    setPage(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    )
  }

  const goToNextPage = () => {
    setPage(
      (current) =>
        Math.min(
          totalPages,
          current + 1
        )
    )
  }

  const loading =
    talentsLoading ||
    (!talentPage &&
      talentsFetching)

  /*
   * ============================================================
   * AFFICHAGE
   * ============================================================
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/40 via-background to-background p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div
          variants={itemVariants}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {t("browse.title")}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                {totalTalents === 1 ? t("browse.availableCountOne", undefined, { count: totalTalents }) : t("browse.availableCountMany", undefined, { count: totalTalents })}
              </p>
            </div>

            {talentsFetching &&
            !loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("browse.refresh")}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder={t("browse.searchLong")}
                value={search}
                onChange={
                  handleSearchChange
                }
                className="h-12 pl-12 pr-4 border-border focus:border-gold focus:ring-gold/30 bg-card text-base"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("")
                    setPage(1)
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
                }
                className="h-12 rounded-xl border border-border bg-card px-4 pr-9 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="recommended">
                  {t("browse.recommendedSort")}
                </option>
                <option value="rating">
                  {t("browse.rating")}
                </option>
                <option value="projects">
                  {t("browse.projectsSort")}
                </option>
                <option value="rate-asc">
                  {t("browse.priceAscending")}
                </option>
                <option value="rate-desc">
                  {t("browse.priceDescending")}
                </option>
              </select>

              <Button
                variant="outline"
                onClick={() =>
                  setShowFilters(
                    (value) =>
                      !value
                  )
                }
                className={cn(
                  "h-12 gap-2 border-border",
                  showFilters ||
                    activeFiltersCount >
                      0
                    ? "bg-gold/10 border-gold text-gold-dark"
                    : ""
                )}
              >
                <Filter className="h-4 w-4" />
                {t("browse.filters")}

                {activeFiltersCount >
                0 ? (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                ) : null}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="space-y-4"
        >
          <Tabs
            value={
              selectedCategory
            }
            onValueChange={
              handleCategoryChange
            }
          >
            <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
              {categoryOptions.map(
                (category) => {
                  const Icon =
                    category.icon

                  return (
                    <TabsTrigger
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                      className={cn(
                        "h-10 gap-2 rounded-xl border px-4 transition-all data-[state=active]:shadow-md",
                        selectedCategory ===
                          category.id
                          ? "gold-gradient text-primary-foreground border-transparent shadow-gold/30"
                          : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {
                        category.label
                      }
                    </TabsTrigger>
                  )
                }
              )}
            </TabsList>
          </Tabs>

          <AnimatePresence>
            {showFilters ? (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                transition={{
                  duration: 0.25,
                  ease: "easeInOut",
                }}
                className="overflow-hidden"
              >
                <Card className="border-border shadow-sm">
                  <CardContent className="grid gap-5 p-5 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gold-dark" />
                        {t("browse.country")}
                      </label>

                      <select
                        value={
                          selectedCountry
                        }
                        onChange={(event) =>
                          handleCountryChange(
                            event.target
                              .value
                          )
                        }
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                      >
                        {countryOptions.map(
                          (country) => (
                            <option
                              key={
                                country.id
                              }
                              value={
                                country.id
                              }
                            >
                              {
                                country.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-foreground">
                        {t("browse.rateRange")}
                      </label>

                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={
                            minRate
                          }
                          onChange={
                            handleMinRateChange
                          }
                          className="h-11"
                          min={0}
                          max={
                            rateCeiling
                          }
                        />

                        <span className="text-muted-foreground">
                          —
                        </span>

                        <Input
                          type="number"
                          value={
                            maxRate
                          }
                          onChange={
                            handleMaxRateChange
                          }
                          className="h-11"
                          min={minRate}
                          max={
                            rateCeiling
                          }
                        />
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={
                          rateCeiling
                        }
                        step={RATE_STEP}
                        value={Math.min(
                          maxRate,
                          rateCeiling
                        )}
                        onChange={(event) => {
                          setMaxRate(
                            Math.max(
                              Number(
                                event
                                  .target
                                  .value
                              ),
                              minRate
                            )
                          )
                          setPage(1)
                        }}
                        className="w-full accent-gold"
                      />

                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>
                          {formatMoney(minRate, "XOF", language)}
                        </span>

                        <span>
                          {t("browse.maxPrice")}:{" "}{formatMoney(rateCeiling, "XOF", language)}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex flex-wrap items-center gap-3 md:justify-between">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              availableOnly
                            }
                            onChange={(event) => {
                              setAvailableOnly(
                                event.target
                                  .checked
                              )
                              setPage(1)
                            }}
                            className="h-4 w-4 rounded accent-gold"
                          />
                          {t("browse.availableOnly")}
                        </label>

                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              verifiedOnly
                            }
                            onChange={(event) => {
                              setVerifiedOnly(
                                event.target
                                  .checked
                              )
                              setPage(1)
                            }}
                            className="h-4 w-4 rounded accent-gold"
                          />
                          {t("browse.verifiedOnly")}
                        </label>
                      </div>

                      <Button
                        variant="ghost"
                        onClick={
                          resetFilters
                        }
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        {t("browse.resetFiltersAction")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {(loadError ||
          talentsError) && (
          <motion.div
            variants={itemVariants}
          >
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">
                  {loadError ||
                    talentsError?.message ||
                    t("errors.loading")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="h-8 w-8 text-gold animate-spin"
              aria-label={t("common.loading")}
            />
          </div>
        ) : (
          <>
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {filteredTalents.length}
                </span>{" "}
                {t("browse.resultsDisplayed", undefined, { displayed: filteredTalents.length, total: totalTalents })}
              </p>

              {totalPages > 1 ? (
                <p className="text-xs text-muted-foreground">
{t("browse.pageOf", undefined, { page, total: totalPages })}
                </p>
              ) : null}
            </motion.div>

            <motion.div
              variants={
                containerVariants
              }
              initial="hidden"
              animate="visible"
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filteredTalents.length ===
              0 ? (
                <motion.div
                  variants={
                    itemVariants
                  }
                  className="col-span-full"
                >
                  <Card className="border-dashed border-border bg-card/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark">
                        <Search className="h-8 w-8" />
                      </div>

                      <h3 className="text-lg font-semibold">
                        {t("browse.noResultsTitle")}
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                        {t("browse.noResultsDescription")}
                      </p>

                      <Button
                        onClick={
                          resetFilters
                        }
                        variant="outline"
                        className="mt-5 border-gold/50 text-gold-dark hover:bg-accent"
                      >
                        {t("browse.resetFiltersAction")}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                filteredTalents.map(
                  (talent) => (
                    <motion.div
                      key={
                        talent.id
                      }
                      variants={
                        itemVariants
                      }
                      layout
                    >
                      <Card className="group h-full border-gold/15 transition-all duration-300 hover:border-border hover:shadow-xl hover:shadow-gold/10 hover:-translate-y-0.5">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-14 w-14 ring-2 ring-gold/30 ring-offset-2 ring-offset-card">
                                <AvatarFallback className="gold-gradient text-white font-bold text-lg">
                                  {talent.firstName[0] ||
                                    ""}
                                  {talent.lastName[0] ||
                                    ""}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold truncate">
                                    {
                                      talent.firstName
                                    }{" "}
                                    {
                                      talent.lastName
                                    }
                                  </h3>

                                  {talent.verified ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 fill-emerald-50" />
                                  ) : null}
                                </div>

                                {talent.title ? (
                                  <p className="text-sm font-medium text-gold-dark truncate">
                                    {
                                      talent.title
                                    }
                                  </p>
                                ) : null}

                                {(talent.city ||
                                  talent.country) ? (
                                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {[
                                      talent.city,
                                      talent.country,
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        ", "
                                      )}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                toggleFavorite(
                                  talent.id
                                )
                              }
                              className="shrink-0 rounded-full p-2 transition-all hover:bg-rose-50 active:scale-90"
                              aria-label={
                                favorites.has(
                                  talent.id
                                )
                                  ? t("browse.favoriteRemove")
                                  : t("browse.favoriteAdd")
                              }
                            >
                              <Heart
                                className={cn(
                                  "h-5 w-5 transition-all",
                                  favorites.has(
                                    talent.id
                                  )
                                    ? "fill-rose-500 text-rose-500"
                                    : "text-muted-foreground group-hover:text-rose-400"
                                )}
                              />
                            </button>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4 pb-4">
                          {talent.bio ? (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {
                                talent.bio
                              }
                            </p>
                          ) : null}

                          {talent.skills
                            .length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {talent.skills
                                .slice(
                                  0,
                                  4
                                )
                                .map(
                                  (
                                    skill
                                  ) => (
                                    <Badge
                                      key={
                                        skill
                                      }
                                      variant="outline"
                                      className="border-gold/25 bg-gold/5 text-gold-dark text-xs font-medium"
                                    >
                                      {
                                        skill
                                      }
                                    </Badge>
                                  )
                                )}

                              {talent.skills
                                .length >
                              4 ? (
                                <Badge
                                  variant="outline"
                                  className="border-muted text-muted-foreground text-xs"
                                >
                                  +
                                  {talent
                                    .skills
                                    .length -
                                    4}
                                </Badge>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-0.5">
                                <Star className="h-3.5 w-3.5 fill-gold text-gold" />

                                <span className="font-semibold text-foreground">
                                  {talent.rating
                                    ? talent.rating.toFixed(
                                        1
                                      )
                                    : "—"}
                                </span>

                                <span className="text-muted-foreground">
                                  (
                                  {
                                    talent.reviews
                                  }
                                  )
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Briefcase className="h-3.5 w-3.5" />
                                {
                                  talent.completedProjects
                                }{" "}
                                {t("browse.projectsCompleted")}
                              </div>
                            </div>

                            {talent.available ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px]"
                              >
                                {t("common.available")}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-muted text-muted-foreground text-[10px]"
                              >
                                {t("browse.busy")}
                              </Badge>
                            )}
                          </div>
                        </CardContent>

                        <Separator />

                        <CardFooter className="flex items-center justify-between py-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t("browse.dailyRate")}
                            </p>

                            <p className="text-lg font-bold text-gold-dark">
                              {formatCurrency(
                                talent.rate,
                                talent.currency
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/talent/${talent.id}`
                                )
                              }
                              className="text-gold-dark hover:bg-accent h-9 w-9 p-0"
                              title={t("browse.viewProfile")} aria-label={t("browse.viewProfile")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/talent/${talent.id}?contact=1`
                                )
                              }
                              className="h-9 bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              {t("browse.contactAction")}
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  )
                )
              )}
            </motion.div>

            {totalPages > 1 ? (
              <motion.div
                variants={
                  itemVariants
                }
                className="flex flex-wrap items-center justify-center gap-2 pt-2"
              >
                <Button
                  variant="outline"
                  onClick={
                    goToPreviousPage
                  }
                  disabled={
                    page <= 1 ||
                    talentsFetching
                  }
                  className="gap-2 border-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("common.previous")}
                </Button>

                <div className="rounded-xl border border-border bg-card px-4 py-2 text-sm">
{t("browse.pageOf", undefined, { page, total: totalPages })}
                </div>

                <Button
                  variant="outline"
                  onClick={
                    goToNextPage
                  }
                  disabled={
                    page >=
                      totalPages ||
                    talentsFetching
                  }
                  className="gap-2 border-border"
                >
                  {t("common.next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : null}
          </>
        )}
      </motion.div>
    </div>
  )
}
