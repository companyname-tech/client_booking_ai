/**
 * Global do-not-contact (suppression) list — the platform-wide list of phones
 * and emails that are NEVER called/dialed/contacted by any client, campaign,
 * or channel. Backed by the BE /admin/do-not-contact family (global list —
 * no tenant/client concept in the UI). Contract pinned by BE mission
 * t_68d2e759; wire mapping lives in the http repository adapter.
 */

export type DoNotContactKind = 'phone' | 'email'

/** One suppression entry as shown on the Super Admin → Do-not-contact screen. */
export interface DoNotContactEntry {
  id: string
  kind: DoNotContactKind
  /**
   * Stored E.164 for phones, lowercased for emails. Operator data (numbers/
   * emails the operator chose to suppress) — displayed plainly, not masked.
   */
  value: string
  reason: string
  createdAt: string
}

/** Page envelope returned by GET /admin/do-not-contact. */
export interface DoNotContactPage {
  items: DoNotContactEntry[]
  total: number
}

/** Payload for adding an entry (POST /admin/do-not-contact). */
export interface DoNotContactInput {
  kind: DoNotContactKind
  value: string
  reason?: string
}

/** Query params for the paginated list (GET /admin/do-not-contact). */
export interface DoNotContactQuery {
  search?: string
  page?: number
  pageSize?: number
}
