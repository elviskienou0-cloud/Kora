import { useEffect, useRef, useState } from "react"
import {
  motion, useMotionValue, useMotionValueEvent, useReducedMotion,
  useScroll, useSpring, useTransform,
} from "framer-motion"
import { ChevronUp } from "lucide-react"
import { KButton } from "@/components/ui/KButton"
import { EASE, useLite } from "./landingKit.jsx"

/** Halos de fond : désactivés en mode léger (téléphones, économiseur de données). */
export function Aurora() {
  const lite = useLite()
  if (lite) return null
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="kora-lp-aurora absolute -left-1/4 top-0 h-[60vh] w-[60vh] rounded-full bg-primary/10 blur-3xl" />
      <div className="kora-lp-aurora absolute -right-1/4 top-1/3 h-[70vh] w-[70vh] rounded-full bg-gold/15 blur-3xl" style={{ animationDelay: "-6s" }} />
      <div className="kora-lp-aurora absolute -bottom-1/4 left-1/4 h-[55vh] w-[55vh] rounded-full bg-gold/10 blur-3xl" style={{ animationDelay: "-12s" }} />
    </div>
  )
}

/** Halo doré qui suit le curseur (souris uniquement). */
export function CursorGlow() {
  const lite = useLite()
  const reduce = useReducedMotion()
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const sx = useSpring(x, { stiffness: 140, damping: 20 })
  const sy = useSpring(y, { stiffness: 140, damping: 20 })
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (lite || reduce || !window.matchMedia("(pointer: fine)").matches) return undefined
    setOn(true)
    const move = (e) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener("pointermove", move, { passive: true })
    return () => window.removeEventListener("pointermove", move)
  }, [lite, reduce, x, y])
  if (!on) return null
  return (
    <motion.div
      aria-hidden="true"
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-30 -ml-32 -mt-32 h-64 w-64 rounded-full bg-gold/15 blur-3xl"
    />
  )
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.3 })
  return <motion.div aria-hidden="true" style={{ scaleX }} className="gold-gradient fixed inset-x-0 top-0 z-[60] h-1 origin-left" />
}

export function BackToTop({ label }) {
  const { scrollY } = useScroll()
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(false)
  useMotionValueEvent(scrollY, "change", (v) => setVisible(v > 700))
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 24, scale: visible ? 1 : 0.8 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      className="fixed bottom-5 right-5 z-50"
    >
      <KButton
        variant="glass"
        size="icon"
        aria-label={label}
        tabIndex={visible ? 0 : -1}
        onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
      >
        <ChevronUp className="h-5 w-5" />
      </KButton>
    </motion.div>
  )
}

/** Mot géant décoratif qui glisse doucement au défilement. */
export function BigWord() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const lite = useLite()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const x = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"])
  return (
    <div ref={ref} aria-hidden="true" className="select-none overflow-hidden py-4">
      <motion.p
        style={reduce || lite ? undefined : { x }}
        className="kora-lp-gold whitespace-nowrap text-center text-[24vw] font-extrabold leading-none tracking-tighter opacity-25"
      >
        KORA
      </motion.p>
    </div>
  )
}
