import { useEffect, useRef, useState } from "react"
import { ChevronUp } from "lucide-react"
import { KButton } from "@/components/ui/KButton"

export function ScrollProgress() {
  const progressRef = useRef(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
        progressRef.current?.style.setProperty("transform", "scaleX(" + progress + ")")
      })
    }

    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    update()
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return <div className="kora-lp-scroll-progress" aria-hidden="true"><span ref={progressRef} /></div>
}

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
