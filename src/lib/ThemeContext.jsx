import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

const STORAGE_KEY = "kora-theme"
const DEFAULT_THEME = "system"

const ThemeContext = createContext(null)

function normalizeTheme(value) {
  return ["light", "dark", "system"].includes(value) ? value : DEFAULT_THEME
}

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return normalizeTheme(window.localStorage.getItem(STORAGE_KEY))
    } catch {
      return DEFAULT_THEME
    }
  })
  const [defaultTheme, setDefaultTheme] = useState(DEFAULT_THEME)

  useEffect(() => {
    let cancelled = false

    const loadDefaultTheme = async () => {
      const { data } = await supabase.rpc("get_kora_default_theme")
      if (!cancelled) {
        const next = normalizeTheme(data)
        setDefaultTheme(next)

        let stored = null
        try {
          stored = window.localStorage.getItem(STORAGE_KEY)
        } catch {
          // Ignore storage restrictions.
        }

        if (!stored) setThemeState(next)
      }
    }

    loadDefaultTheme()
    return () => { cancelled = true }
  }, [])

  const effectiveTheme = theme === "system" ? getSystemTheme() : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", effectiveTheme === "dark")
    root.style.colorScheme = effectiveTheme

    const media = window.matchMedia?.("(prefers-color-scheme: dark)")
    if (theme !== "system" || !media) return undefined

    const handleChange = () => {
      root.classList.toggle("dark", media.matches)
      root.style.colorScheme = media.matches ? "dark" : "light"
    }

    media.addEventListener?.("change", handleChange)
    return () => media.removeEventListener?.("change", handleChange)
  }, [effectiveTheme, theme])

  const setTheme = useCallback((nextTheme) => {
    const next = normalizeTheme(nextTheme)
    setThemeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Theme still works for the current session.
    }
  }, [])

  const resetToDefault = useCallback(() => {
    setTheme(defaultTheme)
  }, [defaultTheme, setTheme])

  const value = useMemo(() => ({
    theme,
    effectiveTheme,
    defaultTheme,
    setTheme,
    resetToDefault,
  }), [theme, effectiveTheme, defaultTheme, setTheme, resetToDefault])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used inside ThemeProvider")
  return context
}
