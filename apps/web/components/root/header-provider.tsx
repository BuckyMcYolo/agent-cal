"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { usePathname } from "next/navigation"

export type HeaderConfig = {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}

type HeaderContextValue = {
  config: HeaderConfig
  setHeader: (config: HeaderConfig) => void
  setActions: (actions: React.ReactNode) => void
  clearHeader: () => void
}

const HeaderContext = createContext<HeaderContextValue | null>(null)

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>({})
  const pathname = usePathname()

  useEffect(() => {
    // Reset header on route change to avoid leaking state between pages
    setConfig({})
  }, [pathname])

  const setHeader = useCallback((newConfig: HeaderConfig) => {
    setConfig((prev) => ({ ...prev, ...newConfig }))
  }, [])

  const setActions = useCallback((actions: React.ReactNode) => {
    setConfig((prev) => ({ ...prev, actions }))
  }, [])

  const clearHeader = useCallback(() => setConfig({}), [])

  const value = useMemo(
    () => ({ config, setHeader, setActions, clearHeader }),
    [config, setHeader, setActions, clearHeader]
  )

  return (
    <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
  )
}

export function useHeader() {
  const ctx = useContext(HeaderContext)
  if (!ctx) throw new Error("useHeader must be used within a HeaderProvider")
  return ctx
}
