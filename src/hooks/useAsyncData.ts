import { useCallback, useEffect, useRef, useState } from 'react'

export interface ReloadOptions {
  /** Refresh data without swapping the page into a loading shell. */
  silent?: boolean
}

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: (options?: ReloadOptions) => void
}

function message(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  return 'Failed to load data'
}

/**
 * Fetch async data with loading / error states. `load` is read through a ref
 * so it never goes stale; pass `deps` to re-fetch when inputs change.
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  deps: React.DependencyList = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadRef = useRef(load)
  loadRef.current = load

  const run = useCallback((options?: ReloadOptions) => {
    let cancelled = false
    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }
    loadRef.current()
      .then((value) => {
        if (cancelled) return
        setData(value)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(message(err))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => run(), [run])

  const reload = useCallback((options?: ReloadOptions) => {
    run(options)
  }, [run])

  return { data, loading, error, reload }
}
