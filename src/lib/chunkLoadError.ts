const STALE_RELOAD_KEY = 'hermes_stale_reload_once'

function messageFromUnknown(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return String(error)
}

/** Detect Vite/Rollup lazy-chunk failures after a new deployment. */
export function isChunkLoadError(error: unknown): boolean {
  const msg = messageFromUnknown(error)
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk')
  )
}

/** Reload once per session so a fresh index.html picks up new hashed assets. */
export function reloadOnceOnStaleChunk(): boolean {
  if (sessionStorage.getItem(STALE_RELOAD_KEY)) return false
  sessionStorage.setItem(STALE_RELOAD_KEY, '1')
  window.location.reload()
  return true
}

export function clearStaleReloadFlag(): void {
  sessionStorage.removeItem(STALE_RELOAD_KEY)
}

export function handleGlobalChunkLoadError(error: unknown): void {
  if (isChunkLoadError(error)) reloadOnceOnStaleChunk()
}
