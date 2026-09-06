/** Centralized app configuration and storage keys. */

export const storageKeys = {
  authSession: 'aba_auth_session',
  sidebarCollapsed: 'aba.sidebar.collapsed',
  campaignDraft: 'aba.campaign-draft.v1',
} as const

function envFlag(value: string | undefined, defaultValue = true): boolean {
  if (value === undefined || value === '') return defaultValue
  return value === 'true' || value === '1'
}

export const env = {
  /** When true, UI uses mock adapters. Set VITE_USE_MOCK_DATA=false to use HTTP adapter. */
  useMockData: envFlag(import.meta.env.VITE_USE_MOCK_DATA, true),
  /** Base URL for API requests (no trailing slash). */
  apiBaseUrl: (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:3000/api',
  storageKeys,
} as const
