/** Centralized app configuration and storage keys. */

export const storageKeys = {
  authSession: 'aba_auth_session',
  sidebarCollapsed: 'aba.sidebar.collapsed',
  campaignDraft: 'aba.campaign-draft.v1',
} as const

export const env = {
  /** Base URL for API requests (no trailing slash). Same-origin `/api`, reverse-proxied to the backend. */
  apiBaseUrl: (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api',
  storageKeys,
} as const
