import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
const STORAGE_KEY = "kora-theme"
const DEFAULT_THEME = "light"

const ThemeContext = createContext(null)

function normalizeTheme(value) {
  return value === "dark" ? "dark" : "light"
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return normalizeTheme(window.localStorage.getItem(STORAGE_KEY))
    } catch {
      return DEFAULT_THEME
    }
  })
  const defaultTheme = DEFAULT_THEME
  const effectiveTheme = theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", effectiveTheme === "dark")
    root.style.colorScheme = effectiveTheme
    root.dataset.theme = effectiveTheme
  }, [effectiveTheme])

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
    setTheme(DEFAULT_THEME)
  }, [setTheme]

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
