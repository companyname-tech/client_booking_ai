import type { Zone } from '@/lib/navigation'
import { env } from '@/config/environment'
import { demoUsers } from '@/config/demo-users'
import type { AuthService, AuthSession } from '@/api/contracts/auth'

export const mockAuthService: AuthService = {
  readSession(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(env.storageKeys.authSession)
      if (!raw) return null
      return JSON.parse(raw) as AuthSession
    } catch {
      return null
    }
  },

  clearSession() {
    sessionStorage.removeItem(env.storageKeys.authSession)
  },

  loginAsClient(): AuthSession {
    const session: AuthSession = {
      zone: 'client',
      email: demoUsers.client.email,
      name: demoUsers.client.name,
    }
    sessionStorage.setItem(env.storageKeys.authSession, JSON.stringify(session))
    return session
  },

  loginAsAdmin(): AuthSession {
    const session: AuthSession = {
      zone: 'admin',
      email: demoUsers.admin.email,
      name: demoUsers.admin.name,
    }
    sessionStorage.setItem(env.storageKeys.authSession, JSON.stringify(session))
    return session
  },

  loginWithCredentials(email, password) {
    const normalized = email.trim().toLowerCase()
    if (!normalized || !password) {
      return { ok: false, error: 'Enter your email and password.' }
    }
    if (normalized === demoUsers.client.email.toLowerCase() && password === demoUsers.client.password) {
      return { ok: true, session: this.loginAsClient() }
    }
    if (normalized === demoUsers.admin.email.toLowerCase() && password === demoUsers.admin.password) {
      return { ok: true, session: this.loginAsAdmin() }
    }
    return { ok: false, error: 'Invalid email or password. Try the demo credentials below.' }
  },

  homeForZone(zone: Zone) {
    return zone === 'admin' ? '/admin/overview' : '/client/overview'
  },
}
