import { useEffect, useState } from "react"
import { ChevronUp } from "lucide-react"
import { KButton } from "@/components/ui/KButton"

export function BackToTop({ label }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let previous = false
    const update = () => {
      const next = window.scrollY > 700
      if (next !== previous) {
        previous = next
        setVisible(next)
      }
    }

    window.addEventListener("scroll", update, { passive: true })
    update()
    return () => window.removeEventListener("scroll", update)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <KButton
        variant="glass"
        size="icon"
        className="min-h-12 min-w-12"
        aria-label={label}
        onClick={() => {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
          window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
        }}
      >
        <ChevronUp className="h-5 w-5" aria-hidden="true" />
      </KButton>
    </div>
  )
}
