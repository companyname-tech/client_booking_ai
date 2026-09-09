import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageLoading } from '@/components/ui/LoadingState'
import { isChunkLoadError, reloadOnceOnStaleChunk } from '@/lib/chunkLoadError'

function errorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Request failed (${error.status})`
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred.'
}

export function RouteErrorFallback() {
  const error = useRouteError()
  const staleChunk = isChunkLoadError(error)

  useEffect(() => {
    if (staleChunk) reloadOnceOnStaleChunk()
  }, [staleChunk])

  if (staleChunk) {
    return <PageLoading />
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <ErrorState
        title="Unable to load this page"
        message={errorMessage(error)}
        onRetry={() => window.location.reload()}
      />
    </div>
  )
}
