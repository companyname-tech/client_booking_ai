import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import type { Zone } from '@/lib/navigation'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { env } from '@/config/environment'

interface ShellState {
  zone: Zone
  collapsed: boolean
  toggleCollapsed: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
  isDesktop: boolean
}

const ShellContext = createContext<ShellState | null>(null)

export function ShellProvider({ zone, children }: { zone: Zone; children: ReactNode }) {
  const [collapsed, setCollapsed] = useLocalStorage(env.storageKeys.sidebarCollapsed, false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const isDesktop = useIsDesktop()
  const location = useLocation()

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Global shortcuts: ⌘K command menu, ⌘B / [ sidebar toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((o) => !o)
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setCollapsed((c) => !c)
      } else if (e.key === '[' && !typing && !e.metaKey && !e.ctrlKey) {
        setCollapsed((c) => !c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCollapsed])

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), [setCollapsed])

  const value = useMemo<ShellState>(
    () => ({ zone, collapsed, toggleCollapsed, mobileOpen, setMobileOpen, commandOpen, setCommandOpen, isDesktop }),
    [zone, collapsed, toggleCollapsed, mobileOpen, commandOpen, isDesktop],
  )

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

export function useShell() {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used within <ShellProvider>')
  return ctx
}
