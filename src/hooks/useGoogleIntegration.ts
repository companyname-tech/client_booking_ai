import { useCallback } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import type { GoogleIntegrationState } from '@/types/calendar'

/** Google Calendar connection state + connect/disconnect actions. */
export function useGoogleIntegration(clientId?: string) {
  const { data, loading, error, reload } = useAsyncData(
    () => repo.getGoogleIntegration(clientId),
    [clientId],
  )

  const connect = useCallback(() => {
    // Full-page navigation to the OAuth consent URL (never fetch()).
    window.location.href = repo.googleAuthUrl({ clientId, returnTo: '/client/calendar' })
  }, [clientId])

  const disconnect = useCallback(async () => {
    await repo.disconnectGoogle(clientId)
    reload()
  }, [clientId, reload])

  return {
    state: (data ?? { connected: false }) as GoogleIntegrationState,
    loading,
    error,
    reload,
    connect,
    disconnect,
  }
}
