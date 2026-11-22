import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const variants = {
  gold: "border border-amber-500/30 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 hover:brightness-105",
  glass: "border border-foreground/15 bg-background/75 text-foreground shadow-sm backdrop-blur-xl hover:-translate-y-0.5 hover:bg-background",
}

const sizes = {
  sm: "min-h-9 px-4 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-14 px-7 py-3.5 text-base",
  icon: "h-11 w-11 p-0",
}

export function GlassBar({ as: Component = "div", className, children, ...props }) {
  return (
    <Component
      className={cn(
        "rounded-2xl border border-white/45 bg-white/65 shadow-[0_12px_36px_-18px_rgba(40,28,8,0.28)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.08]",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export function KButton({
  children,
  className,
  variant = "gold",
  size = "md",
  arrow = false,
  magnetic: _magnetic,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.gold,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {arrow && <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />}
    </button>
  )
}
