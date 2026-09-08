import type { AuthSession } from '@/api/contracts/auth'

/**
 * Console-access helpers. The permission grant set on the user (set by the
 * Super Admin → Permissions screen and returned by /auth/login as the
 * *effective* list, incl. implied section views) is the single source of
 * truth for what a role-"admin" session may use. super_admin is role-based
 * (implicitly everything). client_user is client-scoped + contact-masked and
 * now permission-gated too: an EMPTY permission list keeps the legacy
 * full-scoped-access behaviour; a non-empty list restricts the session to
 * exactly the granted console areas (mirroring the BE enforcement).
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

/** True when this session may open "any console view" areas. */
export function hasAnyConsoleView(session: AccessSession | null | undefined): boolean {
  if (!session) return false
  if (isSuperAdmin(session)) return true
  const perms = session.permissions ?? []
  // An unrestricted client_user (no grants stored) keeps full scoped access.
  if (session.role === 'client_user' && perms.length === 0) return true
  return perms.some((key) => CONSOLE_SECTION_VIEWS.has(key))
}

/**
 * Can this session use the console area guarded by `perm`?
 * - super_admin → everything.
 * - client_user with NO grants → legacy behaviour (full access within the
 *   assigned clients; the BE still 403s it on admin families).
 * - client_user with grants → exactly the granted key (effective list from
 *   the BE — the same deny-by-default rule as role "admin").
 * - role "admin" → exactly the granted key (effective list from the BE).
 */
export function canUse(
  session: AccessSession | null | undefined,
  perm: string | undefined,
): boolean {
  if (!session) return false
  if (session.role === 'super_admin') return true
  const perms = session.permissions ?? []
  // Unrestricted client_user (empty grants) passes everything non-admin.
  if (session.role === 'client_user' && perms.length === 0) return true
  if (!perm) return hasAnyConsoleView(session)
  if (perm === ANY_CONSOLE_VIEW) return hasAnyConsoleView(session)
  if (perm === SUPER_ADMIN_ONLY) return false
  return perms.includes(perm)
}

/** Role labels for badges/lists (catalog endpoint provides richer copy). */
export function roleLabel(role: string): string {
  if (role === 'super_admin') return 'Super admin'
  if (role === 'admin') return 'Admin'
  return 'Worker'
}
