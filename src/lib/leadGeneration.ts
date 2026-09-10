/**
 * src/lib/leadGeneration.ts — pure payload builders + result normalization for
 * the Generate Leads flow (classic generator + smart prospect search).
 *
 * The modal collects form state and calls `runSmartSearch`/`runClassicGeneration`
 * (which live in the modal, hitting the repository). These helpers translate a
 * form into the wire request and normalize either backend reply into the view
 * model the modal renders — so the UI never re-maps wire shapes inline.
 */
import type {
  LeadGenerateRequest,
  LeadImportResult,
  SmartSearchRequest,
  SmartSearchResponse,
} from '@/types/leadGeneration'

export interface SmartSearchForm {
  offerId: string
  query: string
  country: string
  countryCode: string
  industry: string
  phoneType: string
  platforms: string[]
  contactTypes: string[]
  recencyDays: number
  maxResults: number
  dedupMode: string
}

/** POST /leads/smart-search body — exact wire field set. */
export function buildSmartSearchPayload(f: SmartSearchForm): SmartSearchRequest {
  return {
    offer_id: f.offerId,
    query: f.query,
    country: f.country,
    country_code: f.countryCode,
    industry: f.industry,
    phone_type: f.phoneType,
    platforms: f.platforms,
    contact_types: f.contactTypes,
    recency_days: f.recencyDays,
    max_results: f.maxResults,
    dedup_mode: f.dedupMode,
    import_results: true,
  }
}

export interface ClassicGenForm {
  offerId: string
  country: string
  phoneType: string
  industry: string
  number: number
  dedupMode: string
}

/** POST /leads/generate body — classic generator. */
export function buildClassicPayload(f: ClassicGenForm): LeadGenerateRequest {
  return {
    offer_id: f.offerId,
    country: f.country,
    phone_type: f.phoneType || 'any',
    industry: f.industry,
    number_of_leads: f.number || 10,
    dedup_mode: f.dedupMode,
  }
}

export type GenDuplicate = {
  name: string
  matched: string
  status?: string
  reasons: string[]
}

export type GenTopLead = {
  name: string
  rel: number
  intent: number
  url?: string
  duplicateOf?: string
  matchReason?: string
  secondBest?: boolean
}

export type GenCoverage = {
  platform: string
  status: string
  detail?: string
  results?: number
}

export interface SmartSearchResultView {
  found?: number
  imported?: number
  updated?: number
  skippedDuplicates?: number
  requested?: number
  topLeads: GenTopLead[]
  coverage: GenCoverage[]
  planKeywords: string[]
  planGeography?: string
  duplicates: GenDuplicate[]
  errors: string[]
}

export interface GenResultView {
  smart: boolean
  smartView?: SmartSearchResultView
  classicFound?: number
  classicRequested?: number
  imported?: number
  updated?: number
  skippedDuplicates?: number
  duplicates: GenDuplicate[]
  errors: string[]
}

/**
 * Distinguish smart-search replies (carry `found` + `coverage`) from the
 * classic generator reply (carries `found`/`requested` only).
 */
export function isSmartSearchResult(r: SmartSearchResponse | LeadImportResult): r is SmartSearchResponse {
  return (r as SmartSearchResponse).found !== undefined && (r as SmartSearchResponse).coverage !== undefined
}

/** Normalize either backend reply into the view data the modal renders. */
export function toGenResultView(r: SmartSearchResponse | LeadImportResult): GenResultView {
  const dup: GenDuplicate[] = ((r as { duplicates?: { lead_name?: string; matched?: string; status?: string; reasons?: string[] }[] }).duplicates ?? []).map(
    (d) => ({
      name: d.lead_name ?? '',
      matched: d.matched ?? '',
      status: d.status ?? '',
      reasons: d.reasons ?? [],
    }),
  )
  const errors = (r as { errors?: string[] }).errors ?? []

  if (isSmartSearchResult(r)) {
    const coverage: GenCoverage[] = ((r.coverage ?? []) as { platform?: string; status?: string; detail?: string; results?: number }[]).map(
      (c) => ({
        platform: c.platform ?? '',
        status: c.status ?? '',
        detail: c.detail ?? '',
        results: c.results,
      }),
    )
    const plan = (r.plan ?? {}) as { positive_keywords?: string[]; geography?: string }
    const topLeads: GenTopLead[] = ((r.leads ?? []) as {
      lead_name?: string
      relevance_score?: number
      intent_score?: number
      evidence_url?: string
      duplicate_of?: string
      match_reason?: string
      selection_summary?: string
    }[]).map((l) => {
      const matchReason = l.selection_summary || l.match_reason || ''
      return {
        name: l.lead_name ?? '',
        rel: Math.round((l.relevance_score ?? 0) * 100),
        intent: Math.round((l.intent_score ?? 0) * 100),
        url: l.evidence_url,
        duplicateOf: l.duplicate_of,
        matchReason,
        secondBest: (l.match_reason ?? '').startsWith('Second-best match'),
      }
    })
    return {
      smart: true,
      smartView: {
        found: r.found,
        imported: r.imported,
        updated: r.updated,
        skippedDuplicates: r.skipped_duplicates,
        requested: r.requested,
        topLeads,
        coverage,
        planKeywords: plan.positive_keywords ?? [],
        planGeography: plan.geography,
        duplicates: dup,
        errors,
      },
      imported: r.imported,
      updated: r.updated,
      skippedDuplicates: r.skipped_duplicates,
      duplicates: dup,
      errors,
    }
  }

  const c = r as LeadImportResult
  return {
    smart: false,
    classicFound: c.found,
    classicRequested: c.requested,
    imported: c.imported,
    updated: c.updated,
    skippedDuplicates: c.skipped_duplicates,
    duplicates: dup,
    errors,
  }
}
