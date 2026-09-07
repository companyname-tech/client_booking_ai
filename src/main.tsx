import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import App from './App.tsx'

// A freshly deployed build invalidates old lazy chunks (content-hashed filenames).
// If the browser tries to load a chunk that no longer exists, silently reload to
// pick up the new shell instead of showing a React error boundary message.
window.addEventListener('error', (event) => {
  const msg = event.message || (event.error && event.error.message) || ''
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed')
  ) {
    window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
