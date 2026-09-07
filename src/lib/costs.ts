/** Pure view-formatting helpers for the Costs screen (no DOM, no state). */

export function fmtUSD(value: number | null | undefined): string {
  const v = Number(value ?? 0)
  if (v === 0) return '$0.00'
  if (v >= 1) return `$${v.toFixed(2)}`
  return `$${v.toFixed(4)}`
}

export function fmtInt(n: number | null | undefined): string {
  return (Number(n ?? 0) || 0).toLocaleString()
}

const COST_LABELS: Record<string, string> = {
  lead_generation: 'Lead generation',
  lead_analysis: 'Lead analysis',
  call: 'Voice calls',
  call_briefing: 'Briefing calls',
  call_outcome: 'Call outcome',
  agent_chat: 'Agent chat',
  tts: 'Text-to-speech',
}

export function operationLabel(key: string): string {
  return COST_LABELS[key] ?? key
}

export function timeOfDay(iso?: string): string {
  return iso ? String(iso).slice(11, 19) : ''
}
