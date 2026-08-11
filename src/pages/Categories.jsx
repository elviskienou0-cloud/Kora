import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles, Search, ChevronRight, Users, Filter, ArrowRight, X, Star, MapPin, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/AuthContext"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { cn, formatCurrency } from "@/lib/utils"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5 } }),
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }

const TALENTS_BY_CATEGORY = {
  tech: [
    { id: "t1", name: "Nana Kwarteng", role: "Développeuse React Senior", country: "🇬🇭 Ghana", avatar: "NK", price: 55000, rating: 4.9, reviews: 142, skills: ["React", "Next.js", "TypeScript"] },
    { id: "t2", name: "Tunde Balogun", role: "Ingénieur DevOps", country: "🇳🇬 Nigéria", avatar: "TB", price: 65000, rating: 5, reviews: 89, skills: ["AWS", "Docker", "Kubernetes"] },
    { id: "t3", name: "Aïcha Bah", role: "Data Engineer", country: "🇸🇳 Sénégal", avatar: "AB", price: 50000, rating: 4.8, reviews: 67, skills: ["Python", "Spark", "SQL"] },
  ],
  creative: [
    { id: "t4", name: "Sadio Mané", role: "Designer UI/UX", country: "🇸🇳 Sénégal", avatar: "SM", price: 40000, rating: 5, reviews: 112, skills: ["Figma", "Branding", "Design System"] },
    { id: "t5", name: "Zara Abubakar", role: "Directrice Artistique", country: "🇳🇪 Niger", avatar: "ZA", price: 48000, rating: 4.9, reviews: 76, skills: ["Photoshop", "Illustrator", "Motion"] },
    { id: "t6", name: "Kofi Asante", role: "Graphiste", country: "🇬🇭 Ghana", avatar: "KA", price: 30000, rating: 4.7, reviews: 203, skills: ["Logo", "Print", "Identité"] },
  ],
  business: [
    { id: "t7", name: "Moussa Traoré", role: "Consultant Stratégie", country: "🇲🇱 Mali", avatar: "MT", price: 75000, rating: 5, reviews: 54, skills: ["Business Plan", "Levée de fonds"] },
  ],
  marketing: [
    { id: "t8", name: "Léa Koffi", role: "Growth Marketer", country: "🇨🇮 Côte d'Ivoire", avatar: "LK", price: 35000, rating: 4.9, reviews: 98, skills: ["SEO", "Ads", "Content"] },
  ],
  finance: [
    { id: "t9", name: "Yao Yao", role: "Expert Comptable", country: "🇨🇮 Côte d'Ivoire", avatar: "YY", price: 42000, rating: 4.8, reviews: 41, skills: ["Comptabilité", "Fiscalité", "Finance"] },
  ],
  legal: [
    { id: "t10", name: "Amina Bello", role: "Avocate d'affaires", country: "🇳🇬 Nigéria", avatar: "YB", price: 80000, rating: 5, reviews: 32, skills: ["Droit des affaires", "Contrats"] },
  ],
  education: [
    { id: "t11", name: "Peter Omondi", role: "Formateur Certifié", country: "🇰🇪 Kenya", avatar: "PO", price: 25000, rating: 4.9, reviews: 156, skills: ["Formation", "Coaching", "E-learning"] },
  ],
  health: [
    { id: "t12", name: "Dr. Fatou Dieng", role: "Consultante Santé", country: "🇸🇳 Sénégal", avatar: "FD", price: 55000, rating: 5, reviews: 28, skills: ["Santé publique", "Consultation"] },
  ],
}

export default function Categories() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [active, setActive] = useState("all")
  const [search, setSearch] = useState("")
  const [showMobile, setShowMobile] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true })
  }, [isAuthenticated, navigate])

  const filtered = APP_PARAMS.categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedTalents = active === "all"
    ? Object.values(TALENTS_BY_CATEGORY).flat().slice(0, 8)
    : TALENTS_BY_CATEGORY[active] || []

  const activeCategory = APP_PARAMS.categories.find(c => c.id === active)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/10 to-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-2xl border-b border-gold/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/25">
              <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black gold-text-gradient">{APP_PARAMS.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobile(!showMobile)}>
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-gold/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <Badge variant="gold" className="mb-4 px-4 py-1.5 text-xs font-bold">
            8 domaines • {APP_PARAMS.categories.reduce((s, c) => s + c.count, 0).toLocaleString("fr-FR")}+ talents
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Explorez toutes les <span className="gold-text-gradient">catégories</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Des développeurs nigérians aux designers ivoiriens, trouvez l'expert qu'il vous faut
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une catégorie, un talent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 text-base rounded-2xl shadow-lg shadow-gold/5 border-gold/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-14">
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Toutes les catégories</h2>
              <p className="text-muted-foreground font-medium">Sélectionnez une catégorie pour affiner</p>
            </div>
            {active !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setActive("all")} className="gap-1.5">
                <X className="h-4 w-4" /> Effacer le filtre
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.button
              onClick={() => setActive("all")}
              variants={fadeInUp}
              custom={0}
              whileHover={{ y: -4 }}
              className={cn(
                "relative rounded-2xl border-2 p-5 text-left transition-all duration-200 overflow-hidden",
                active === "all"
                  ? "border-gold bg-gradient-to-br from-gold/15 to-amber-50 shadow-lg shadow-gold/10 ring-2 ring-gold/20"
                  : "border-border/60 hover:border-gold/30 hover:bg-gold/5"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/20">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                {active === "all" && <Badge variant="gold" className="text-[10px] font-bold">Sélectionné</Badge>}
              </div>
              <h3 className="font-black text-lg mb-1">Voir tout</h3>
              <p className="text-sm font-semibold text-muted-foreground">
                {APP_PARAMS.categories.reduce((s, c) => s + c.count, 0).toLocaleString("fr-FR")} talents
              </p>
            </motion.button>
            {filtered.map((cat, i) => {
              const Icon = getCategoryIcon(cat.icon)
              const isActive = active === cat.id
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setActive(cat.id)}
                  variants={fadeInUp}
                  custom={i + 1}
                  whileHover={{ y: -4 }}
                  className={cn(
                    "relative rounded-2xl border-2 p-5 text-left transition-all duration-200 overflow-hidden",
                    isActive
                      ? "border-gold bg-gradient-to-br from-gold/15 to-amber-50 shadow-lg shadow-gold/10 ring-2 ring-gold/20"
                      : "border-border/60 hover:border-gold/30 hover:bg-gold/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/20">
                      <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2} />
                    </div>
                    {isActive && <Badge variant="gold" className="text-[10px] font-bold">Sélectionné</Badge>}
                  </div>
                  <h3 className="font-black text-base mb-1 line-clamp-2 min-h-[2.5rem]">{cat.name}</h3>
                  <p className="text-sm font-bold gold-text-gradient">{cat.count.toLocaleString("fr-FR")} talents</p>
                </motion.button>
              )
            })}
          </div>
        </motion.section>

        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="space-y-6">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              {activeCategory ? (
                <>
                  <Badge variant="default" className="mb-2 px-3 py-1 text-xs font-bold">{activeCategory.name}</Badge>
                  <h2 className="text-2xl font-black tracking-tight">Talents en {activeCategory.name.toLowerCase()}</h2>
                  <p className="text-muted-foreground font-medium">{selectedTalents.length} profils trouvés dans cette catégorie</p>
                </>
              ) : (
                <>
                  <Badge variant="gold" className="mb-2 px-3 py-1 text-xs font-bold">Toutes catégories</Badge>
                  <h2 className="text-2xl font-black tracking-tight">Talents en vedette</h2>
                  <p className="text-muted-foreground font-medium">Une sélection des meilleurs profils du moment</p>
                </>
              )}
            </div>
          </div>

          {selectedTalents.length === 0 ? (
            <Card>
              <CardContent className="p-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gold/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-gold-dark" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aucun talent dans cette catégorie pour le moment</h3>
                <p className="text-muted-foreground mb-6">Revenez plus tard ou explorez d'autres catégories</p>
                <Button onClick={() => setActive("all")} className="gap-2">
                  Voir tous les talents <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {selectedTalents.map((t, i) => (
                <motion.div
                  key={t.id}
                  variants={fadeInUp}
                  custom={i}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => navigate(`/talent/${t.id}`)}
                  className="cursor-pointer"
                >
                  <Card className="h-full">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-14 w-14 ring-2 ring-gold/30">
                          <AvatarFallback className="text-base">{t.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{t.country}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold">{t.rating}</span>
                            <span className="text-[10px] text-muted-foreground">({t.reviews})</span>
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-sm mb-1 line-clamp-1">{t.role}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {t.skills.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                      </div>
                      <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-muted-foreground">À partir de</p>
                          <p className="text-lg font-black gold-text-gradient">{formatCurrency(t.price)}<span className="text-[10px] text-muted-foreground ml-1 font-medium">/jour</span></p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs gap-1">
                          Voir <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  )
}
