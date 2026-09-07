import type { Zone } from '@/lib/navigation'
import type { AdminUserRole } from '@/types/admin'

export interface AuthSession {
  zone: Zone
  email: string
  name: string
  /** Authenticated principal role (mirrors the BE users row / env admin). */
  role: AdminUserRole
  /**
   * Effective console grants for role "admin" (incl. implied section views),
   * as returned by /auth/login — the single source of truth the UI uses to
   * show/hide console areas. super_admin/client_user sessions get [] (their
   * access is role-based).
   */
  permissions: string[]
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
