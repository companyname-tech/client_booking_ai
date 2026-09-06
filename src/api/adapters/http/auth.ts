import { env } from '@/config/environment'
import type { AuthService, AuthSession } from '@/api/contracts/auth'
import type { Zone } from '@/lib/navigation'

function readStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(env.storageKeys.authSession)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

/**
 * HTTP auth adapter stub.
 * Implement loginWithCredentials using apiClient.post('/auth/login', ...).
 * See docs/API_CONTRACT.md#auth
 */
export const httpAuthService: AuthService = {
  readSession: readStoredSession,

  clearSession() {
    sessionStorage.removeItem(env.storageKeys.authSession)
  },

  loginAsClient(): AuthSession {
    throw new Error('Quick login is disabled in HTTP mode. Implement role-based login in http/auth.ts')
  },

  loginAsAdmin(): AuthSession {
    throw new Error('Quick login is disabled in HTTP mode. Implement role-based login in http/auth.ts')
  },

  loginWithCredentials(_email, _password) {
    // TODO: POST /auth/login — example:
    // const { session, token } = await apiClient.post('/auth/login', { email, password })
    // sessionStorage.setItem(env.storageKeys.authSession, JSON.stringify(session))
    // apiClient.setAuthToken(token)
    return {
      ok: false,
      error: 'HTTP auth not implemented. Wire POST /auth/login in src/api/adapters/http/auth.ts',
    }
  },

  homeForZone(zone: Zone) {
    return zone === 'admin' ? '/admin/overview' : '/client/overview'
  },
}
