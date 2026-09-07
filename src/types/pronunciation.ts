/**
 * Pronunciation lexicon — backend contract types.
 *
 * Mirrors the leads_to_conversion backend:
 *   - GET/PUT /agent/config        → `pronunciation_lexicon` (global tier)
 *   - GET /agents, PUT /agents/{id} → `pronunciation_lexicon` (per-agent tier)
 *   - POST /agent/pronunciation/transcribe (multipart) → { pronounce_as, language }
 *
 * The locked entry shape is `{ word, pronounce_as, language }`; `id` is
 * CLIENT-ONLY (a stable React list key assigned on load/add and stripped before
 * save — the backend contract has no id and ignores unknown fields).
 */

export interface PronunciationLexiconEntry {
  /** The word as written — English or Hebrew (or any language). */
  word: string
  /** How the AI should say it (phonetic hint or transliteration). */
  pronounce_as: string
  /** Language code (he / en / …). */
  language: string
  /** Client-only stable list key — never sent to the backend. */
  id?: string
}

/** POST /agent/pronunciation/transcribe reply. */
export interface TranscribePronunciationReply {
  pronounce_as: string
  language: string
}

/** Lightweight agent option for the per-agent lexicon selector. */
export interface PronunciationAgentOption {
  agentId: string
  name: string
}

/**
 * Minimal backend wire shapes (snake_case) for the pronunciation endpoints.
 * These are intentionally narrow — only the fields the lexicon slice needs;
 * the full AgentOut/AgentConfigOut DTOs are a separate BE-wiring item.
 */

/** GET /agents element (subset). */
export interface PronunciationAgentDto {
  agent_id: string
  name: string
  pronunciation_lexicon?: PronunciationLexiconEntry[]
}

/** GET/PUT /agent/config body (subset). */
export interface PronunciationConfigDto {
  pronunciation_lexicon?: PronunciationLexiconEntry[]
}
