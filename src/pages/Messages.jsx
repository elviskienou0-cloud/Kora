import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Sparkles,
  Search,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Check,
  CheckCheck,
  X,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/AuthContext"
import { APP_PARAMS } from "@/lib/app-params"
import { cn } from "@/lib/utils"

const CONVERSATIONS = [
  {
    id: "c1",
    name: "Nana Kwarteng",
    avatar: "NK",
    lastMessage: "Parfait ! Je commence dès demain matin 👌",
    time: "12:04",
    unread: 2,
    online: true,
    role: "Développeuse React",
    country: "🇬🇭 Ghana",
  },
  {
    id: "c2",
    name: "Sadio Mané",
    avatar: "SM",
    lastMessage: "Le maquette envoyée sur Figma !",
    time: "10:32",
    unread: 0,
    online: true,
    role: "Designer UI/UX",
    country: "🇸🇳 Sénégal",
  },
  {
    id: "c3",
    name: "Équipe Support KORA",
    avatar: "EK",
    lastMessage: "Merci pour votre confiance ✨",
    time: "Hier",
    unread: 1,
    online: false,
    role: "Support Client",
    country: "🌍 Afrique",
  },
  {
    id: "c4",
    name: "Léa Koffi",
    avatar: "LK",
    lastMessage: "On se rappelle la semaine prochaine ?",
    time: "Hier",
    unread: 0,
    online: false,
    role: "Growth Marketer",
    country: "🇨🇮 Côte d'Ivoire",
  },
  {
    id: "c5",
    name: "Moussa Traoré",
    avatar: "MT",
    lastMessage: "Business plan finalisé 📄",
    time: "lun.",
    unread: 0,
    online: true,
    role: "Consultant",
    country: "🇲🇱 Mali",
  },
]

const INITIAL_MESSAGES = {
  c1: [
    { id: "m1", sender: "them", text: "Bonjour ! Merci pour le brief 👋", time: "11:45", status: "read" },
    { id: "m2", sender: "them", text: "J'ai bien analysé votre besoin en développement React / Node.js. Votre projet est super intéressant !", time: "11:46", status: "read" },
    { id: "m3", sender: "me", text: "Salut Nana, merci de t'y intéresser. Tu penses pouvoir commencer quand ?", time: "11:55", status: "read" },
    { id: "m4", sender: "them", text: "Sans souci ! J'ai fini mon projet en cours aujourd'hui, je peux démarrer demain matin si vous êtes d'accord 🚀", time: "12:00", status: "read" },
    { id: "m5", sender: "me", text: "Top ! On valide. Tu peux envoyer ton devis pour 30 jours à 55k/jour ?", time: "12:02", status: "read" },
    { id: "m6", sender: "them", text: "Parfait ! Je commence dès demain matin 👌", time: "12:04", status: "read" },
  ],
  c2: [
    { id: "m1", sender: "them", text: "Salut ! J'ai terminé la v2 du design system ✨", time: "09:15", status: "read" },
    { id: "m2", sender: "me", text: "Incroyable travail Sadio 🔥", time: "10:20", status: "read" },
    { id: "m3", sender: "them", text: "Le maquette envoyée sur Figma !", time: "10:32", status: "delivered" },
  ],
  c3: [
    { id: "m1", sender: "them", text: "Bienvenue sur KORA ! 🎉", time: "09:00", status: "read" },
    { id: "m2", sender: "them", text: "Votre compte est prêt. Vous pouvez dès maintenant trouver des talents ou déposer un projet.", time: "09:00", status: "read" },
    { id: "m3", sender: "me", text: "Merci pour votre confiance ✨", time: "18:00", status: "read" },
  ],
}

export default function Messages() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [activeId, setActiveId] = useState("c1")
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [showMobileConv, setShowMobileConv] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true })
  }, [isAuthenticated, navigate])

  const active = CONVERSATIONS.find(c => c.id === activeId)
  const activeMessages = messages[activeId] || []

  const filteredConv = CONVERSATIONS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSend = (e) => {
    e?.preventDefault()
    if (!input.trim()) return
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const newMsg = { id: `nm_${Date.now()}`, sender: "me", text: input.trim(), time, status: "sending" }
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), newMsg] }))
    const sent = { ...newMsg, status: "delivered" }
    setInput("")
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeId]: (prev[activeId] || []).map(m => m.id === newMsg.id ? sent : m)
      }))
    }, 700)
    setTimeout(() => {
      const replies = [
        "D'accord, parfait ! 👌",
        "Je m'en occupe immédiatement.",
        "Super idée, allons-y 🚀",
        "Merci pour le message ! Je reviens vers toi très vite.",
      ]
      const reply = {
        id: `r_${Date.now()}`,
        sender: "them",
        text: replies[Math.floor(Math.random() * replies.length)],
        time: `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
        status: "read"
      }
      setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []).map(m => m.id === sent.id ? { ...m, status: "read" } : m), reply] }))
      toast.message("Nouveau message", { description: `${active?.name} a répondu.` })
    }, 1800)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="shrink-0 border-b border-gold/15 bg-background/85 backdrop-blur-2xl z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/home" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/25">
                <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black gold-text-gradient">{APP_PARAMS.name}</span>
            </Link>
          </div>
          <h1 className="hidden md:block font-black tracking-tight">Messages</h1>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <Badge variant="gold" className="text-[11px] font-bold">{CONVERSATIONS.reduce((s, c) => s + c.unread, 0)}</Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full">
        <div className={cn(
          "w-full md:w-96 shrink-0 border-r border-border flex flex-col overflow-hidden transition-all duration-300",
          !showMobileConv && "hidden md:flex"
        )}>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une conversation"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConv.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { setActiveId(c.id); setShowMobileConv(false) }}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-2xl mb-1.5 transition-all text-left",
                    activeId === c.id
                      ? "bg-gold/10 border border-gold/25"
                      : "hover:bg-accent/60 border border-transparent"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-sm font-bold">{c.avatar}</AvatarFallback>
                    </Avatar>
                    {c.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={cn("font-bold truncate", c.unread > 0 && "")}>{c.name}</p>
                      <span className={cn("text-[10px] shrink-0 font-semibold", c.unread > 0 ? "text-gold-dark" : "text-muted-foreground")}>{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-xs truncate", c.unread > 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>{c.lastMessage}</p>
                      {c.unread > 0 && (
                        <span className="shrink-0 w-5 h-5 rounded-full gold-gradient text-[10px] font-black text-primary-foreground flex items-center justify-center">{c.unread}</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          showMobileConv && "hidden md:flex"
        )}>
          {active ? (
            <>
              <div className="shrink-0 h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card/50">
                <div className="flex items-center gap-3 min-w-0">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileConv(true)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm">{active.avatar}</AvatarFallback>
                    </Avatar>
                    {active.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{active.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{active.role} • {active.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-xl"><Phone className="h-4.5 w-4.5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl"><Video className="h-4.5 w-4.5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-4.5 w-4.5" /></Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
                  <div className="text-center my-2">
                    <Badge variant="secondary" className="text-[10px] font-semibold">Aujourd'hui</Badge>
                  </div>
                  <AnimatePresence initial={false}>
                    {activeMessages.map((m, i) => {
                      const isMe = m.sender === "me"
                      const prev = activeMessages[i - 1]
                      const showAvatar = !isMe && (!prev || prev.sender !== "them")
                      return (
                        <motion.div
                          key={m.id}
                          layout
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25 }}
                          className={cn("flex gap-2.5", isMe ? "justify-end" : "justify-start")}
                        >
                          {!isMe && (
                            <div className="w-8 shrink-0">
                              {showAvatar ? (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">{active.avatar}</AvatarFallback>
                                </Avatar>
                              ) : null}
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[75%] sm:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm",
                            isMe
                              ? "gold-gradient text-primary-foreground rounded-br-md"
                              : "bg-card border border-border/60 rounded-bl-md"
                          )}>
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            <div className={cn("flex items-center gap-1.5 mt-1 justify-end", isMe ? "text-primary-foreground/80" : "text-muted-foreground")}>
                              <span className="text-[10px] font-semibold">{m.time}</span>
                              {isMe && (
                                m.status === "read" ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                : m.status === "delivered" ? <CheckCheck className="h-3.5 w-3.5" />
                                : <Check className="h-3.5 w-3.5" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              <div className="shrink-0 border-t border-border p-3 sm:p-4 bg-card/30">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-2.5">
                  <Button type="button" variant="ghost" size="icon" className="rounded-xl shrink-0 hidden sm:inline-flex"><Paperclip className="h-5 w-5" /></Button>
                  <div className="relative flex-1">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="pr-11 h-11 rounded-2xl"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold-dark transition-colors">
                      <Smile className="h-5 w-5" />
                    </button>
                  </div>
                  <Button type="submit" size="icon" className="rounded-xl shrink-0 h-11 w-11" disabled={!input.trim()}>
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-10 text-center">
              <div>
                <div className="w-20 h-20 mx-auto rounded-3xl gold-gradient flex items-center justify-center mb-5 shadow-xl shadow-gold/30">
                  <MessageCircle className="h-10 w-10 text-primary-foreground" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-black mb-2">Sélectionnez une conversation</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">Choisissez une discussion dans la liste ou commencez une nouvelle conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
