import { useSyncExternalStore } from 'react'

function subscribe(query: string) {
  return (callback: () => void) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', callback)
    return () => mql.removeEventListener('change', callback)
  }
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Sidebar becomes a fixed rail at `lg`. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')

/** Dense tables need this much room once the sidebar is taken into account. */
export const useIsWide = () => useMediaQuery('(min-width: 1280px)')
