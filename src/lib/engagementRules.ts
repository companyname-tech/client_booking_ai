export interface EngagementRule {
  id: string
  text: string
}

/** Parse the stored process string into individual numbered rules. */
export function parseEngagementRules(process: string): EngagementRule[] {
  const lines = (process ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.map((line) => ({
    id: crypto.randomUUID(),
    text: line.replace(/^\d+[\).\]]\s*/, '').trim() || line,
  }))
}

/** Serialize rules for the conversation-process API (numbered list). */
export function formatEngagementRules(rules: EngagementRule[]): string {
  return rules
    .map((rule) => rule.text.trim())
    .filter(Boolean)
    .map((text, index) => `${index + 1}) ${text}`)
    .join('\n')
}
