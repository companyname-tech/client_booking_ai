import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import App from './App.tsx'

// A freshly deployed build invalidates old lazy chunks (content-hashed filenames).
// If the browser tries to load a chunk that no longer exists, silently reload to
// pick up the new shell instead of showing a React error boundary message.
// Vite lazy-route imports reject via dynamic import() — catch both the window
// 'error' event and 'unhandledrejection', and only reload once per session to
// avoid a loop if the new build itself fails.
const STALE_KEY = 'hermes_stale_reload_once'
function isStaleChunkError(message: string): boolean {
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('ChunkLoadError')
  )
}
function reloadOnceOnStale(): void {
  if (sessionStorage.getItem(STALE_KEY)) return
  sessionStorage.setItem(STALE_KEY, '1')
  window.location.reload()
}
window.addEventListener('error', (event) => {
  const msg = event.message || (event.error && event.error.message) || ''
  if (isStaleChunkError(msg)) reloadOnceOnStale()
})
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const msg =
    (reason && (reason.message || reason.reason?.message || String(reason))) || ''
  if (isStaleChunkError(msg)) reloadOnceOnStale()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
