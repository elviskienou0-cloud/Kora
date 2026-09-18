export default function AdminStats({ cards = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center">
                {Icon ? <Icon className="h-5 w-5 text-gold-dark" /> : null}
              </div>
              <span className="text-[10px] text-muted-foreground">Supabase</span>
            </div>
            <p className="text-2xl font-black mt-4">{card.value ?? "—"}</p>
            <p className="font-bold mt-1">{card.label}</p>
            {card.helper ? <p className="text-xs text-muted-foreground mt-1">{card.helper}</p> : null}
          </div>
        )
      })}
    </div>
  )
}
