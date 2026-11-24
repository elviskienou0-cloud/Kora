import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/ThemeContext.jsx"
import { cn } from "@/lib/utils.js"

export default function ThemeToggle({ className = "" }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("kora-theme-toggle", className)}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      aria-pressed={isDark}
      title={isDark ? "Mode sombre, passer en mode clair" : "Mode clair, passer en mode sombre"}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
      <span className="sr-only">{isDark ? "Mode sombre" : "Mode clair"}</span>
    </button>
  )
}
