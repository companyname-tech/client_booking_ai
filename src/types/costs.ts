/**
 * src/Models/costs.ts — Costs domain contracts (GET /costs/summary, /events, /pricing, /balance).
 * Shapes mirror the backend route returns in backend/app/Server/Routes/Costs/ and the keys
 * the legacy FE reads in js/app/costs.js. Optional fields where the backend returns dicts.
 */

export interface CostOperationBucket {
  events?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
}

export interface CostModelBucket {
  events?: number;
  cost_usd?: number;
}

export interface CostSummary {
  total_cost_usd?: number;
  total_events?: number;
  total_input_tokens?: number;
  total_output_tokens?: number;
  by_operation?: Record<string, CostOperationBucket>;
  by_model?: Record<string, CostModelBucket>;
  by_day?: Record<string, number>;
}

export interface CostEvent {
  created_at?: string;
  operation?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  audio_input_tokens?: number;
  audio_output_tokens?: number;
  tool_calls?: number;
  cost_usd?: number;
}

export interface CostEventsResponse {
  events: CostEvent[];
}

export interface CostPricingEntry {
  input_per_1m?: number;
  output_per_1m?: number;
  cached_input_per_1m?: number;
  audio_input_per_1m?: number;
  audio_output_per_1m?: number;
  web_search_per_1k?: number;
  [key: string]: number | undefined;
}

export interface CostPricing {
  as_of?: string;
  source?: string;
  models?: Record<string, CostPricingEntry>;
}

export interface CostBalance {
  ok?: boolean;
  reason?: string;
  message?: string;
  total_available?: number;
  total_used?: number;
  total_granted?: number;
  as_of?: string;
}
