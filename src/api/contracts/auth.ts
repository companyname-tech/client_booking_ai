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
  clearSession(): Promise<void>
  loginAsClient(): Promise<AuthSession>
  loginAsAdmin(): Promise<AuthSession>
  loginWithCredentials(username: string, password: string): Promise<LoginResult>
  homeForZone(zone: Zone): string
}
