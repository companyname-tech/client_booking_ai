import type { AuthSession } from '@/api/contracts/auth'

/**
 * Console-access helpers. The permission grant set on the user (set by the
 * Super Admin → Permissions screen and returned by /auth/login as the
 * *effective* list, incl. implied section views) is the single source of
 * truth for what a role-"admin" session may use. super_admin is role-based
 * (implicitly everything); client_user keeps its pre-existing behaviour.
 */

/** Marker for "any console section view is enough" (Overview/notifications). */
export const ANY_CONSOLE_VIEW = '__any_console_view__'

/** Marker for areas only a super_admin may enter (Users / Permissions). */
export const SUPER_ADMIN_ONLY = 'users.manage'

export type AccessSession = Pick<AuthSession, 'role' | 'permissions'>

export function isSuperAdmin(session: AccessSession | null | undefined): boolean {
  return session?.role === 'super_admin'
}

/** Console section-view keys the FE knows (mirror of the BE catalog). */
const CONSOLE_SECTION_VIEWS = new Set([
  'clients.view',
  'campaigns.view',
  'leads.view',
  'calls.view',
  'ai_training.view',
  'costs.view',
  'activity.view',
  'settings.view',
])

export function hasAnyConsoleView(session: AccessSession | null | undefined): boolean {
  if (!session) return false
  if (isSuperAdmin(session)) return true
  return (session.permissions ?? []).some((key) => CONSOLE_SECTION_VIEWS.has(key))
}

/**
 * Can this session use the console area guarded by `perm`?
 * - super_admin → everything.
 * - client_user → legacy behaviour (not permission-gated in the UI; the BE
 *   still 403s it on admin families).
 * - role "admin" → exactly the granted key (effective list from the BE).
 */
export function canUse(
  session: AccessSession | null | undefined,
  perm: string | undefined,
): boolean {
  if (!session) return false
  if (session.role === 'client_user') return true
  if (isSuperAdmin(session)) return true
  if (!perm) return hasAnyConsoleView(session)
  if (perm === ANY_CONSOLE_VIEW) return hasAnyConsoleView(session)
  if (perm === SUPER_ADMIN_ONLY) return false
  return (session.permissions ?? []).includes(perm)
}

/** Role labels for badges/lists (catalog endpoint provides richer copy). */
export function roleLabel(role: string): string {
  if (role === 'super_admin') return 'Super admin'
  if (role === 'admin') return 'Admin'
  return 'Client user'
}
