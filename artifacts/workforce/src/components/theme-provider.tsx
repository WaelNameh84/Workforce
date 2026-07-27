import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  resolvedTheme: "dark" | "light"
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  )

  useEffect(() => {
    const root = window.document.documentElement
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const applyTheme = (nextSystemTheme: "dark" | "light" = media.matches ? "dark" : "light") => {
      if (theme === "system") setSystemTheme(nextSystemTheme)
      root.classList.remove("light", "dark")
      root.classList.add(theme === "system" ? nextSystemTheme : theme)
    }
    applyTheme()
    const onSystemThemeChange = (event: MediaQueryListEvent) => applyTheme(event.matches ? "dark" : "light")
    media.addEventListener?.("change", onSystemThemeChange)
    return () => media.removeEventListener?.("change", onSystemThemeChange)
  }, [theme])

  const value = {
    theme,
    resolvedTheme: theme === "system" ? systemTheme : theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}