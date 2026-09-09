import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { clearStaleReloadFlag, isChunkLoadError, reloadOnceOnStaleChunk } from '@/lib/chunkLoadError'

const RETRY_DELAY_MS = 400
const MAX_RETRIES = 2

async function importWithChunkRetry<T extends ComponentType>(
  importer: () => Promise<{ default: T }>,
): Promise<{ default: T }> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const module = await importer()
      clearStaleReloadFlag()
      return module
    } catch (error) {
      lastError = error
      if (!isChunkLoadError(error)) throw error
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS))
        continue
      }
      if (reloadOnceOnStaleChunk()) {
        return { default: (() => null) as unknown as T }
      }
      throw error
    }
  }

  throw lastError
}

/** Lazy route import with stale-chunk retry and one automatic reload after deploys. */
export function lazyRoute<T extends ComponentType>(
  importer: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() => importWithChunkRetry(importer))
}
