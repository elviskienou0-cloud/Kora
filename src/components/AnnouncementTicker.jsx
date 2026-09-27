import { useEffect, useMemo, useState } from "react"
import { Megaphone } from "lucide-react"
import { supabase } from "@/lib/supabase"

function isCurrentlyActive(item) {
  const now = Date.now()
  const startsAt = item.starts_at ? new Date(item.starts_at).getTime() : null
  const endsAt = item.ends_at ? new Date(item.ends_at).getTime() : null

  if (startsAt && startsAt > now) return false
  if (endsAt && endsAt < now) return false
  return true
}

export default function AnnouncementTicker() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id,title,content,starts_at,ends_at,updated_at,created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })

      if (!error && mounted) {
        setItems((data || []).filter(isCurrentlyActive))
      }
    }

    load()

    const channel = supabase
      .channel("kora-announcements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => load()
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  const messages = useMemo(
    () =>
      items
        .map((item) => {
          const text = [item.title, item.content].filter(Boolean).join(" — ").trim()
          return text ? { id: item.id, text } : null
        })
        .filter(Boolean),
    [items]
  )

  if (!messages.length) return null

  const content = [...messages, ...messages]

  return (
    <>
      <style>{`
        @keyframes kora-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <div className="min-w-0 flex-1 mx-2 sm:mx-4 overflow-hidden rounded-full border border-gold/20 bg-gold/5">
        <div className="flex items-center h-10">
          <div className="z-10 shrink-0 flex items-center gap-1.5 px-3 bg-background/95 border-r border-gold/15">
            <Megaphone className="h-4 w-4 text-gold-dark" />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider text-gold-dark">
              KORA
            </span>
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div
              className="flex w-max min-w-full hover:[animation-play-state:paused]"
              style={{ animation: "kora-marquee 28s linear infinite" }}
              aria-label="Annonces KORA"
            >
              {content.map((message, index) => (
                <span
                  key={message.id + "-" + index}
                  className="shrink-0 px-8 text-sm font-semibold text-foreground whitespace-nowrap"
                >
                  {message.text}
                  <span className="mx-8 text-gold">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
