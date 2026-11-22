import { createContext, useContext, useEffect, useRef, useState } from "react"
import {
  animate, motion, useInView, useMotionTemplate, useMotionValue,
  useReducedMotion, useSpring, useTransform,
} from "framer-motion"
import { cn } from "@/lib/utils"

export const EASE = [0.22, 1, 0.36, 1]
export const GOLD_RGB = "212,175,55"

/* ---------- Mode léger : téléphones, économiseur de données, appareils modestes ---------- */
const LiteContext = createContext(false)
export const LiteProvider = LiteContext.Provider
export const useLite = () => useContext(LiteContext)

export function useLiteMode() {
  const [lite, setLite] = useState(false)
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)")
    const update = () => {
      const saveData = Boolean(navigator.connection?.saveData)
      const lowMemory = Boolean(navigator.deviceMemory && navigator.deviceMemory <= 4)
      setLite(coarse.matches || saveData || lowMemory)
    }
    update()
    coarse.addEventListener("change", update)
    return () => coarse.removeEventListener("change", update)
  }, [])
  return lite
}

/** Surface des cartes : verre léger sur grand écran, fond plein en mode léger. */
export function useSurface() {
  const lite = useLite()
  return lite
    ? "border border-border bg-card shadow-[0_10px_28px_-18px_rgba(42,33,21,0.35)]"
    : "border border-border/80 bg-card/80 backdrop-blur-md shadow-[0_18px_48px_-26px_rgba(42,33,21,0.3)] dark:shadow-[0_18px_48px_-26px_rgba(0,0,0,0.6)]"
}

/* ---------- Apparition au défilement ---------- */
const OFFSETS = {
  up: { y: 36 }, down: { y: -24 }, left: { x: -48 }, right: { x: 48 },
  scale: { scale: 0.94, y: 20 }, none: {},
}

export function Reveal({ children, direction = "up", delay = 0, className, as = "div" }) {
  const reduce = useReducedMotion()
  const Component = motion[as] || motion.div
  return (
    <Component
      className={className}
      initial={reduce ? false : { opacity: 0, ...OFFSETS[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </Component>
  )
}

/** Titre révélé mot par mot (texte brut si les animations sont réduites). */
export function WordReveal({ text, className }) {
  const reduce = useReducedMotion()
  if (reduce) return <span className={className}>{text} </span>
  return text.split(" ").map((word, i) => (
    <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <motion.span
        className={cn("inline-block", className)}
        initial={{ y: "110%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: i * 0.05, duration: 0.65, ease: EASE }}
      >
        {word}&nbsp;
      </motion.span>
    </span>
  ))
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
      {eyebrow && <Reveal direction="down"><Eyebrow>{eyebrow}</Eyebrow></Reveal>}
      <h2 id={titleId} className="kora-lp-title">
        <WordReveal text={title} />
        {emphasis && <WordReveal text={emphasis} className="kora-lp-gold" />}
      </h2>
      {description && <Reveal delay={0.12}><p className="kora-lp-lead">{description}</p></Reveal>}
    </header>
  )
}

/* ---------- Compteur animé ---------- */
export function CountUp({ value, format = String }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [text, setText] = useState(() => format(reduce ? value : 0))
  useEffect(() => {
    if (!inView) return undefined
    if (reduce) { setText(format(value)); return undefined }
    const controls = animate(0, value, {
      duration: 1.4, ease: "easeOut",
      onUpdate: (v) => setText(format(Math.round(v))),
    })
    return () => controls.stop()
  }, [inView, value, reduce])
  return <span ref={ref} className="kora-lp-num">{text}</span>
}

/* ---------- Halo doré qui suit la souris ---------- */
export function SpotlightCard({ children, className }) {
  const lite = useLite()
  const mx = useMotionValue(-300)
  const my = useMotionValue(-300)
  const background = useMotionTemplate`radial-gradient(340px circle at ${mx}px ${my}px, rgba(${GOLD_RGB},0.16), transparent 70%)`
  if (lite) return <div className={cn("relative h-full", className)}>{children}</div>
  return (
    <div
      className={cn("group relative h-full", className)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set(e.clientX - r.left)
        my.set(e.clientY - r.top)
      }}
    >
      {children}
      <motion.div
        aria-hidden="true"
        style={{ background }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    </div>
  )
}

/* ---------- Inclinaison 3D au survol ---------- */
export function Tilt({ children, className, max = 6 }) {
  const lite = useLite()
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [max, -max]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-max, max]), { stiffness: 200, damping: 20 })
  if (lite || reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Navigation par ancres ---------- */
export function useActiveSection(ids) {
  const [active, setActive] = useState(null)
  const key = ids.join("|")
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    )
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [key])
  return active
}

export function scrollToSection(id, reduce = false) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  try { window.history.replaceState(null, "", `#${id}`) } catch { /* historique indisponible */ }
}
