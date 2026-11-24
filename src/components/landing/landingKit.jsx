import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export const EASE = [0.22, 1, 0.36, 1]

export function Reveal({ children, className }) {
  return <div className={className}>{children}</div>
}

export function Eyebrow({ children }) {
  return (
    <span className="kora-lp-eyebrow-pill">
      <span className="kora-lp-eyebrow-dot" aria-hidden="true" />
      {children}
    </span>
  )
}

export function SectionHeader({ eyebrow, title, emphasis, description, titleId, align = "center" }) {
  return (
    <header className={cn("kora-lp-header", align === "center" && "mx-auto text-center")}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 id={titleId} className="kora-lp-title">
        {title} {emphasis && <span className="kora-lp-title-emphasis">{emphasis}</span>}
      </h2>
      {description && <p className="kora-lp-lead">{description}</p>}
    </header>
  )
}

export function scrollToSection(id, reduce = false) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
}

export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] || "")
  const idsKey = ids.join("|")

  useEffect(() => {
    const targets = idsKey.split("|")
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    if (!targets.length || !("IntersectionObserver" in window)) return undefined

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

      if (visible) setActive(visible.target.id)
    }, {
      rootMargin: "-22% 0px -60% 0px",
      threshold: [0, 0.2, 0.5, 1],
    })

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [idsKey])

  return active
}
