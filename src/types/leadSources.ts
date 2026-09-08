/**
 * src/types/leadSources.ts — Lead Sources & Enrichment wire contracts.
 *
 * Mirrors the leads_to_conversion backend OSINT provider surface (T14, D8):
 *   - GET  /integrations/health    → { integrations: IntegrationHealthRecord[] }
 *   - GET  /integrations/providers → { providers:   IntegrationProviderRow[] }
 *   - PUT  /integrations/providers/{provider} → updated IntegrationProviderRow
 *
 * Secrets rule (D4 / plan §79): the backend NEVER returns key material. A key
 * is only reported as the boolean `configured`; writes accept `key` but the
 * response masks it back to `configured`. The FE therefore never renders (and
 * never stores) a provider secret.
 */

/** One D8 health record — real probe verdict per provider. Tri-state fields
 * are `null` when the provider was never probed / holds no listening endpoint
 * (job tools); the UI must render null as "not checked", never as healthy. */
export interface IntegrationHealthRecord {
  provider: string
  /** Credentials/config present — always a boolean. */
  configured: boolean
  /** True iff the most recent probe reached the endpoint. */
  reachable: boolean | null
  /** True on a 2xx probe, False on 401/403, null when no auth verdict. */
  authorized: boolean | null
  /** True ONLY when configured && reachable && authorized are all true. */
  healthy: boolean | null
  /** ISO-8601 UTC of the last successful probe (null = never). */
  last_success: string | null
  /** ISO-8601 UTC of the last failed probe (null = never). */
  last_failure: string | null
  /** Real measured probe duration in milliseconds. */
  latency_ms: number | null
}

/** One masked provider-config row from GET /integrations/providers. */
export interface IntegrationProviderRow {
  /** Canonical D8 token, e.g. "google_places" / "katana". */
  provider: string
  /** Human label supplied by the backend catalog. */
  label: string
  /** Catalog section: "discovery" (sources) or "enrichment" (improves leads). */
  section: 'discovery' | 'enrichment'
  enabled: boolean
  paid: boolean
  priority: number
  /** Operator-configured base URL of a self-hosted daemon (not a secret). */
  base_url: string
  /** Key present (google_places) / base_url present (http daemons) / enabled
   * (job tools). Key material is never returned. */
  configured: boolean
}

/** Accepted body of PUT /integrations/providers/{provider}. `key` is
 * write-only: it is routed to the credentials store and never echoed back. */
export interface IntegrationProviderPatch {
  enabled?: boolean
  paid?: boolean
  priority?: number
  base_url?: string
  key?: string
}

/** Wire envelope of GET /integrations/health. */
export interface IntegrationsHealthWire {
  integrations?: IntegrationHealthRecord[]
}

/** Wire envelope of GET /integrations/providers. */
export interface IntegrationProvidersWire {
  providers?: IntegrationProviderRow[]
}
