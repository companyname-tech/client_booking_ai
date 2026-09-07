import { env } from '@/config/environment'
import { apiClient } from './client'
import type { AuthService, AuthSession, LoginResult } from '@/api/contracts/auth'
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

function persist(session: AuthSession): AuthSession {
  sessionStorage.setItem(env.storageKeys.authSession, JSON.stringify(session))
  return session
}

/**
 * HTTP auth adapter — single-admin JWT (cookie) auth against the
 * leads_to_conversion backend.
 *
 * POST /auth/login sets an HttpOnly `access_token` cookie that every
 * authenticated route reads (same-origin via the `/api` reverse proxy).
 * We mirror the server's `{user:{username}}` response into the FE
 * `AuthSession` shape and keep the session in sessionStorage for the
 * client-side routing/zone state only (the JWT itself stays in the cookie).
 *
 * The backend is single-tenant: there is one account (`admin`). Both FE zones
 * ("client" and "super admin") resolve to that single admin until a real
 * multi-tenant user model exists (see the data-contract map §1.3).
 */
export const httpAuthService: AuthService = {
  readSession: readStoredSession,

  async clearSession(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Logout is best-effort — clear local state even if the call fails.
    }
    sessionStorage.removeItem(env.storageKeys.authSession)
  },

  async loginAsClient(): Promise<AuthSession> {
    return this.loginAsAdmin()
  },

  async loginAsAdmin(): Promise<AuthSession> {
    // No username/password provided for "quick" login — read the current
    // session from the cookie via /auth/me; if none, the caller should use
    // loginWithCredentials.
    const me = await apiClient.get<{ user?: { username?: string } }>('/auth/me')
    const username = me?.user?.username ?? 'admin'
    return persist({ zone: 'admin', email: username, name: username })
  },

  async loginWithCredentials(username: string, password: string): Promise<LoginResult> {
    const u = username.trim()
    if (!u || !password) {
      return { ok: false, error: 'Enter your username and password.' }
    }
    try {
      const res = await apiClient.post<{ user?: { username?: string } }>('/auth/login', {
        username: u,
        password,
      })
      const name = res?.user?.username ?? u
      const session = persist({ zone: 'admin', email: name, name })
      return { ok: true, session }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign in failed. Check your credentials.'
      return { ok: false, error: message }
    }
  },

  homeForZone(zone: Zone) {
    return zone === 'admin' ? '/admin/overview' : '/client/overview'
  },
}
