// @ts-nocheck

import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  ArrowLeft,
  Star,
  MapPin,
  Briefcase,
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Link2,
  Video,
  Image as ImageIcon,
  FileText,
  CalendarDays,
  Send,
  Loader2,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import { resolvePortfolioUrls } from "@/lib/talentPortfolio"
import TalentRequestButton from "@/components/TalentRequestButton.jsx"
import TalentReviews from "@/components/reviews/TalentReviews.jsx"
import { buildTalentShareUrl, copyTalentShareLink, getTalentShareTargets } from "@/lib/talentShare"

function formatCurrency(value, currency = "XOF") {
  if (value === null || value === undefined) return "—"
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString("fr-FR")} ${currency}`
  }
}

function getInitials(name = "Talent") {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "T"
}

function isVideo(item) {
  return item?.type === "video" || item?.mime_type?.startsWith("video/")
}

function isImage(item) {
  return item?.type === "image" || item?.mime_type?.startsWith("image/")
}

export default function TalentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const authUserId = user?.authId || user?.id

  const [talent, setTalent] = useState(null)
  const [manager, setManager] = useState(null)
  const [skills, setSkills] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [liked, setLiked] = useState(false)
  const [contacting, setContacting] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    if (!talent) return

    const fullName = `${talent.first_name || ""} ${talent.last_name || ""}`.trim() || "Talent KORA"
    const title = `${fullName} — Talent KORA`
    const description = (talent.bio || `${talent.title || "Professionnel"} disponible sur KORA.`).replace(/\s+/g, " ").trim().slice(0, 160)
    const url = `${window.location.origin}/talent/${talent.id}`
    const image = talent.avatar_url || `${window.location.origin}/favicon.svg`

    document.title = title

    const meta = {
      description,
      "og:title": title,
      "og:description": description,
      "og:type": "profile",
      "og:url": url,
      "og:image": image,
      "og:site_name": "KORA",
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": image,
    }

    const nodes = []
    Object.entries(meta).forEach(([key, value]) => {
      const isOg = key.startsWith("og:") || key.startsWith("twitter:")
      const attr = isOg ? "property" : "name"
      let node = document.head.querySelector(`meta[${attr}="${key}"]`)
      if (!node) {
        node = document.createElement("meta")
        node.setAttribute(attr, key)
        document.head.appendChild(node)
        nodes.push({ node, attr, key })
      }
      node.setAttribute("content", value)
    })

    let canonical = document.head.querySelector('link[rel="canonical"]')
    const createdCanonical = !canonical
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.setAttribute("rel", "canonical")
      document.head.appendChild(canonical)
    }
    canonical.setAttribute("href", url)

    return () => {
      document.title = "KORA — Plateforme des talents africains"
      nodes.forEach(({ node }) => node.remove())
      if (createdCanonical) canonical.remove()
    }
  }, [talent])

  useEffect(() => {
    let mounted = true

    async function loadTalent() {
      if (!id) return
      setLoading(true)
      setLoadError("")

      try {
        const { data, error } = await supabase
          .from("talent_profiles")
          .select(`
            id,
            first_name,
            last_name,
            title,
            bio,
            category_id,
            city,
            daily_rate,
            currency,
            rating,
            reviews_count,
            completed_projects,
            verified,
            available,
            avatar_url,
            cover_url,
            status,
            is_visible,
            managed_by,
            created_at,
            categories ( id, slug, name ),
            countries ( id, code, name ),
            talent_profile_skills ( skill_id, skills ( id, name ) )
          `)
          .eq("id", id)
          .maybeSingle()

        if (error) throw error
        if (!data) throw new Error("Ce talent n'est pas disponible.")

        const { data: portfolioRows, error: portfolioError } = await supabase
          .from("portfolio_items")
          .select("id, talent_id, title, description, type, url, storage_path, mime_type, created_at")
          .eq("talent_id", id)
          .order("created_at", { ascending: true })

        if (portfolioError) throw portfolioError

        let managerData = null
        const { data: rpcManager, error: managerError } = await supabase.rpc(
          "get_talent_manager_profile",
          { p_talent_id: id }
        )
        if (!managerError) managerData = rpcManager?.[0] || null

        const portfolioWithUrls = await resolvePortfolioUrls(portfolioRows || [])

        if (!mounted) return

        setTalent(data)
        setSkills((data.talent_profile_skills || []).map((item) => item.skills?.name).filter(Boolean))
        setPortfolio(portfolioWithUrls || [])
        setManager(managerData)
      } catch (error) {
        console.error("Erreur chargement fiche talent :", error)
        if (mounted) setLoadError(error?.message || "Impossible de charger ce talent.")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadTalent()

    return () => {
      mounted = false
    }
  }, [id])



  useEffect(() => {
    if (!authUserId || !id) return

    supabase
      .from("favorites")
      .select("id")
      .eq("client_id", authUserId)
      .eq("talent_id", id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data))
  }, [authUserId, id])

  const talentName = useMemo(() => {
    if (!talent) return "Talent"
    return `${talent.first_name || ""} ${talent.last_name || ""}`.trim() || "Talent"
  }, [talent])

  const toggleFavorite = async () => {
    if (!authUserId) {
      toast.info("Connectez-vous pour enregistrer ce talent dans vos favoris.")
      navigate("/login")
      return
    }

    const next = !liked
    setLiked(next)

    try {
      if (next) {
        const { error } = await supabase.from("favorites").insert({ client_id: authUserId, talent_id: id })
        if (error) throw error
      } else {
        const { error } = await supabase.from("favorites").delete().eq("client_id", authUserId).eq("talent_id", id)
        if (error) throw error
      }
    } catch (error) {
      setLiked(!next)
      toast.error(error?.message || "Impossible de modifier vos favoris")
    }
  }

  const shareUrl = id ? buildTalentShareUrl(id) : window.location.origin
  const shareTitle = `${talentName} — Talent KORA`
  const shareText = `Découvrez le profil de ${talentName} sur KORA`
  const shareTargets = getTalentShareTargets({ url: shareUrl, title: shareTitle, text: shareText })

  const handleNativeShare = async () => {
    try {
      if (!navigator.share) {
        await copyTalentShareLink(shareUrl)
        toast.success("Lien du profil copié ✅")
        return
      }

      await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
    } catch (error) {
      if (error?.name !== "AbortError") toast.error("Impossible de partager ce profil")
    }
  }

  const handleCopyShare = async () => {
    try {
      await copyTalentShareLink(shareUrl)
      toast.success("Lien du profil copié ✅")
      setShowShareMenu(false)
    } catch (error) {
      toast.error(error?.message || "Impossible de copier le lien")
    }
  }

  const openShareTarget = (target) => {
    window.open(target, "_blank", "noopener,noreferrer,width=720,height=680")
    setShowShareMenu(false)
  }

  useEffect(() => {
    if (searchParams.get("contact") === "1" && talent && manager?.id) {
      setSearchParams({}, { replace: true })
      handleContact()
    }
  }, [searchParams, talent, manager])

  const handleContact = async () => {
    if (!isAuthenticated || !authUserId) {
      toast.info("Connectez-vous pour contacter ce talent.")
      navigate("/login")
      return
    }

    if (!manager?.id) {
      toast.error("Le manager de ce talent n'est pas disponible.")
      return
    }

    if (manager.id === authUserId) {
      toast.info("Ce talent est géré par votre propre compte.")
      return
    }

    setContacting(true)
    try {
      const { data, error } = await supabase.rpc("create_direct_conversation", {
        p_other_user_id: manager.id,
        p_talent_id: talent.id,
      })

      if (error) throw error

      const conversationId = typeof data === "string" ? data : data?.conversation_id || data?.[0]?.conversation_id
      if (!conversationId) throw new Error("Conversation introuvable.")

      // Le serveur rattache la conversation au talent et réutilise
      // automatiquement la conversation existante si elle existe déjà.
      navigate(`/messages?conversation=${conversationId}`)
    } catch (error) {
      console.error("Erreur contact manager :", error)
      toast.error(error?.message || "Impossible d'ouvrir la conversation")
    } finally {
      setContacting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Chargement du profil…</div>
      </div>
    )
  }

  if (!talent || loadError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full"><CardContent className="p-8 text-center">
          <h1 className="text-xl font-black">Talent indisponible</h1>
          <p className="text-sm text-muted-foreground mt-2">{loadError || "Ce profil n'existe pas ou n'est plus visible."}</p>
          <Button className="mt-5" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>
        </CardContent></Card>
      </div>
    )
  }

  const location = [talent.city, talent.countries?.name].filter(Boolean).join(", ") || "Localisation non renseignée"
  const published = talent.status === "published" && talent.is_visible
  const initials = getInitials(talentName)

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/30 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Talent Detail</p>
            <h1 className="text-2xl font-black tracking-tight">Profil de {talentName}</h1>
          </div>
        </div>

        {!published && (
          <Card className="border-amber-500/20 bg-amber-500/5"><CardContent className="p-4 text-sm text-amber-700 dark:text-amber-300">Ce profil n’est pas encore publié publiquement. Seul le manager propriétaire ou un administrateur peut actuellement le consulter.</CardContent></Card>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-border/60">
              <div className="relative h-44 sm:h-56 lg:h-64 overflow-hidden bg-gradient-to-br from-gold/30 via-amber-400/20 to-violet-400/20">
                {talent.cover_url ? (
                  <img
                    src={talent.cover_url}
                    alt={`Couverture de ${talentName}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              </div>
              <CardContent className="p-6 pt-0 -mt-12 relative">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg shrink-0">
                    {talent.avatar_url ? (
                      <img src={talent.avatar_url} alt={talentName} className="h-full w-full object-cover" />
                    ) : null}
                    <AvatarFallback className="gold-gradient text-white text-2xl font-black">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-2xl font-black tracking-tight">{talentName}</h2>
                      {talent.verified && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-[10px] font-bold"><CheckCircle2 className="h-3 w-3" /> Vérifié KORA</Badge>}
                    </div>
                    <p className="text-base font-semibold text-gold-dark mb-2">{talent.title || "Professionnel"}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {location}</span>
                      <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {talent.categories?.name || "Catégorie non renseignée"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 relative">
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={toggleFavorite} title="Ajouter aux favoris"><Heart className={cn("h-4.5 w-4.5", liked && "fill-red-500 stroke-red-500")} /></Button>
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setShowShareMenu((value) => !value)} title="Partager"><Share2 className="h-4.5 w-4.5" /></Button>
                    {showShareMenu && (
                      <div className="absolute right-0 top-12 z-30 w-64 rounded-2xl border bg-background shadow-xl p-3 space-y-1">
                        <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground">Partager ce profil</p>
                        <button type="button" onClick={() => openShareTarget(shareTargets.whatsapp)} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-emerald-50 transition-colors">WhatsApp</button>
                        <button type="button" onClick={() => openShareTarget(shareTargets.facebook)} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors">Facebook</button>
                        <button type="button" onClick={() => openShareTarget(shareTargets.x)} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors">X</button>
                        <button type="button" onClick={handleCopyShare} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-gold/10 transition-colors">Copier le lien</button>
                        <Separator className="my-1" />
                        <button type="button" onClick={handleNativeShare} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors">Partager avec l'appareil</button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-6">
                  <div>
                    <h3 className="font-black mb-2">À propos</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{talent.bio || "Aucune présentation renseignée."}</p>
                  </div>

                  <div>
                    <h3 className="font-black mb-3">Compétences</h3>
                    {skills.length ? <div className="flex flex-wrap gap-2">{skills.map((skill) => <Badge key={skill} variant="secondary" className="px-3 py-1 text-xs font-semibold">{skill}</Badge>)}</div> : <p className="text-sm text-muted-foreground">Aucune compétence renseignée.</p>}
                  </div>

                  <div>
                    <h3 className="font-black mb-3">Disponibilité</h3>
                    <div className="rounded-2xl border border-border/60 p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-gold" /></div>
                      <div>
                        <p className="font-bold">{talent.available ? "Disponible" : "Indisponible"}</p>
                        <p className="text-xs text-muted-foreground">{talent.available ? "Le talent accepte de nouvelles missions." : "Le talent n'accepte pas de nouvelles missions pour le moment."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader><CardTitle className="font-black flex items-center gap-2"><ImageIcon className="h-5 w-5 text-gold" /> Portfolio</CardTitle><CardDescription>Photos, vidéos et liens ajoutés par le Manager.</CardDescription></CardHeader>
              <CardContent>
                {portfolio.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Aucun élément de portfolio pour le moment.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {portfolio.map((item) => (
                      <a key={item.id} href={item.url || "#"} target="_blank" rel="noreferrer" className="group rounded-2xl border border-border/60 overflow-hidden hover:border-gold/40 transition-colors">
                        {isImage(item) && item.url ? <img src={item.url} alt={item.title || talentName} className="w-full h-48 object-cover" /> : isVideo(item) && item.url ? <video src={item.url} className="w-full h-48 object-cover bg-black" controls /> : <div className="h-48 bg-muted/40 flex items-center justify-center">{item.type === "link" ? <Link2 className="h-10 w-10 text-gold" /> : item.type === "document" ? <FileText className="h-10 w-10 text-gold" /> : <Video className="h-10 w-10 text-gold" />}</div>}
                        <div className="p-4"><p className="font-bold truncate">{item.title || "Portfolio"}</p><p className="text-xs text-muted-foreground mt-1">{item.type === "link" ? "Lien externe" : isVideo(item) ? "Vidéo" : isImage(item) ? "Image" : "Document"}</p></div>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <TalentReviews talentId={talent.id} />
          </div>

          <div className="space-y-6">
            <Card className="sticky top-20 overflow-hidden border-gold/20 shadow-xl shadow-gold/5">
              <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-baseline justify-between gap-4">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Tarif journalier</p><p className="text-3xl font-black gold-text-gradient">{formatCurrency(talent.daily_rate, talent.currency || "XOF")}</p></div>
                  <Badge className={talent.available ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"}>{talent.available ? "Disponible" : "Indisponible"}</Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><div className="flex items-center justify-center gap-1 mb-1"><Star className="h-4 w-4 text-gold fill-gold" /><span className="font-black">{Number(talent.rating || 0).toFixed(1)}</span></div><p className="text-[11px] text-muted-foreground">Note</p></div>
                  <div><p className="font-black">{Number(talent.reviews_count || 0)}</p><p className="text-[11px] text-muted-foreground">Avis</p></div>
                  <div><p className="font-black">{Number(talent.completed_projects || 0)}</p><p className="text-[11px] text-muted-foreground">Projets</p></div>
                </div>
                <div className="grid gap-2">
                  <Button className="gap-2" onClick={handleContact} disabled={contacting}><MessageCircle className="h-4 w-4" /> {contacting ? "Ouverture…" : "Contacter"}</Button>
                  <TalentRequestButton talentId={talent.id} talentName={talentName} />
                </div>
              </CardContent>
            </Card>


            <Card className="border-border/60">
              <CardHeader><CardTitle className="font-black flex items-center gap-2"><UserRound className="h-5 w-5 text-gold" /> Manager</CardTitle><CardDescription>Responsable de ce talent.</CardDescription></CardHeader>
              <CardContent>
                {manager ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12"><AvatarFallback className="gold-gradient text-white font-black">{getInitials(manager.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="font-bold truncate">{manager.name || "Manager KORA"}</p><p className="text-xs text-muted-foreground">Gestionnaire KORA</p></div>
                  </div>
                ) : <p className="text-sm text-muted-foreground">Informations du manager indisponibles.</p>}
              </CardContent>
            </Card>

            <Card className="border-border/60"><CardContent className="p-5 text-sm text-muted-foreground flex gap-3"><ShieldCheck className="h-5 w-5 text-gold shrink-0" /><span>Les informations affichées proviennent directement du profil Talent et de son portfolio enregistré dans Supabase.</span></CardContent></Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}