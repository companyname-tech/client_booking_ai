import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { handleGlobalChunkLoadError } from '@/lib/chunkLoadError'
import App from './App.tsx'

// Backup net for chunk failures that escape React Router (e.g. prefetch).
window.addEventListener('error', (event) => {
  handleGlobalChunkLoadError(event.error ?? event.message)
})
window.addEventListener('unhandledrejection', (event) => {
  handleGlobalChunkLoadError(event.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
