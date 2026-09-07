/**
 * Pure helpers for the pronunciation lexicon: stable client ids, language
 * labels, and language-grouped ordering. Used by both adapters and the UI.
 */
import type { PronunciationLexiconEntry } from '@/types/pronunciation'

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  he: 'Hebrew',
}

/** Header label for a language group (known codes mapped, raw code fallback). */
export function languageLabel(code: string): string {
  const c = (code ?? '').trim()
  return LANGUAGE_LABELS[c] ?? (c || '—')
}

export interface LanguageGroup {
  /** Raw language code ("" for entries with no language). */
  lang: string
  label: string
  items: PronunciationLexiconEntry[]
}

/**
 * Group entries under language headers. en/he lead, then remaining codes
 * alphabetically; entries with no language group under "—".
 */
export function groupByLanguage(
  entries: PronunciationLexiconEntry[],
): LanguageGroup[] {
  const groups = new Map<string, PronunciationLexiconEntry[]>()
  for (const e of entries) {
    const lang = (e.language ?? '').trim()
    if (!groups.has(lang)) groups.set(lang, [])
    groups.get(lang)!.push(e)
  }
  const lead = ['en', 'he']
  const keys = [...groups.keys()].sort((a, b) => {
    const ia = lead.indexOf(a)
    const ib = lead.indexOf(b)
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    }
    return a.localeCompare(b)
  })
  return keys.map((lang) => ({
    lang,
    label: lang ? languageLabel(lang) : '—',
    items: groups.get(lang)!,
  }))
}

let idCounter = 0

/** Client-only stable id for a list row (never sent to the backend). */
export function newEntryId(): string {
  idCounter += 1
  return `lex-${Date.now().toString(36)}-${idCounter}`
}

/** Ensure each entry carries a stable client id (assigned once on load). */
export function ensureEntryIds(
  entries: readonly PronunciationLexiconEntry[],
): PronunciationLexiconEntry[] {
  return entries.map((e) => (e.id ? e : { ...e, id: newEntryId() }))
}

/** Drop the client id (and empty rows) before persisting to the backend. */
export function stripEntryIds(
  entries: readonly PronunciationLexiconEntry[],
): { word: string; pronounce_as: string; language: string }[] {
  return entries
    .map((e) => ({
      word: (e.word ?? '').trim(),
      pronounce_as: (e.pronounce_as ?? '').trim(),
      language: (e.language ?? '').trim() || 'he',
    }))
    .filter((e) => e.word || e.pronounce_as)
}
