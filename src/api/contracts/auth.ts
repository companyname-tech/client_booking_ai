import type { Zone } from '@/lib/navigation'

export interface AuthSession {
  zone: Zone
  email: string
  name: string
}

export type LoginResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string }

export interface AuthService {
  readSession(): AuthSession | null
  clearSession(): void
  loginAsClient(): AuthSession
  loginAsAdmin(): AuthSession
  loginWithCredentials(email: string, password: string): LoginResult
  homeForZone(zone: Zone): string
}
