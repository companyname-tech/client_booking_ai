/**
 * src/types/leadGeneration.ts — lead-generation wire contracts.
 * Mirrors the backend schemas under `Models/Schemas/Lead/`
 * (model_lead_generate_request, model_lead_import_result,
 * model_smart_search_request, model_smart_search_response,
 * model_smart_search_lead_out, model_smart_search_plan_out,
 * model_platform_coverage). These are the exact snake_case bodies the
 * `POST /leads/generate` and `POST /leads/smart-search` endpoints accept/return.
 */

/** Body of POST /leads/generate (backend LeadGenerateRequest). */
export interface LeadGenerateRequest {
  offer_id?: string
  country: string
  phone_type?: string // 'mobile' | 'landline' | 'any'
  industry: string
  number_of_leads?: number
  dedup_mode?: string // 'skip' | 'import_anyway'
}

/** A skipped/impossible duplicate entry (backend emits a list of plain dicts). */
export interface LeadImportDuplicate {
  lead_name?: string
  matched?: string
  status?: string // EXISTING | POSSIBLE_DUPLICATE | ...
  reasons?: string[]
}

/** Response of POST /leads/import/preview (backend ImportPreviewResponse). */
export interface ImportPreviewResponse {
  file_name?: string
  offer_id?: string
  detected_language?: string
  rows_detected?: number
  valid_rows?: number
  warnings?: number
  errors?: number
  column_mapping?: Record<string, string>
}

/** Response of POST /leads/generate + POST /leads/import (backend LeadImportResult). */
export interface LeadImportResult {
  imported?: number
  updated?: number
  skipped_duplicates?: number
  duplicates?: LeadImportDuplicate[]
  errors?: string[]
  requested?: number
  found?: number
}

/** Body of POST /leads/smart-search (backend SmartSearchRequest). */
export interface SmartSearchRequest {
  offer_id?: string
  query: string
  country?: string
  country_code?: string
  industry?: string
  phone_type?: string
  /**
   * Social sources to scan. Canonical values: 'web', 'reddit', 'linkedin',
   * 'facebook', 'instagram', 'x', 'google_business' (aliases 'twitter' and
   * 'google_maps'/'google' are canonicalized server-side). 'telegram' is
   * feature-flagged off. Omitted → every runnable source is scanned.
   */
  platforms?: string[]
  contact_types?: string[]
  recency_days?: number
  max_results?: number
  dedup_mode?: string
  import_results?: boolean
}

/** A single discovered lead in a smart-search response (backend SmartSearchLeadOut). */
export interface SmartSearchLead {
  lead_name?: string
  website_link?: string
  phone_number?: string
  phone_source?: string
  email?: string
  website_problems?: string
  industry?: string
  relevance_score?: number
  intent_score?: number
  match_reason?: string
  source_platform?: string
  evidence_url?: string
  evidence_snippet?: string
  matched_content?: string
  contact_confidence?: string
  facebook_url?: string
  instagram_url?: string
  lead_id?: string
  imported?: boolean
  duplicate_of?: string
}

/** The LLM-derived search plan (backend SmartSearchPlanOut). */
export interface SmartSearchPlan {
  positive_keywords?: string[]
  negative_keywords?: string[]
  pain_terms?: string[]
  intent_terms?: string[]
  competitor_terms?: string[]
  geography?: string
  language?: string
  industries?: string[]
  contact_types?: string[]
  recency_days?: number
  platform_queries?: Record<string, string[]>
}

/** Per-platform source coverage (backend PlatformCoverage). */
export interface PlatformCoverage {
  platform?: string
  requested?: boolean
  status?: string // searched | unavailable | disabled | error
  detail?: string
  results?: number
}

/** Response of POST /leads/smart-search (backend SmartSearchResponse). */
export interface SmartSearchResponse {
  query?: string
  plan?: SmartSearchPlan
  leads?: SmartSearchLead[]
  coverage?: PlatformCoverage[]
  imported?: number
  updated?: number
  skipped_duplicates?: number
  errors?: string[]
  requested?: number
  found?: number
}
