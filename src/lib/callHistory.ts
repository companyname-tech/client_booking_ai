/** Call-history view helpers (raw BE PostCallOutcome labels + duration/time). */

const OUTCOME_LABELS: Record<string, string> = {
  BOOKED: 'Booked',
  BOOKED_NO_EMAIL: 'Booked (no email)',
  NOT_INTERESTED: 'Not interested',
  DO_NOT_CALL: 'Do not call',
  NOT_ANSWERED: 'Not answered',
  CALLBACK_REQUESTED: 'Callback requested',
  CALL_SCHEDULED: 'Call scheduled',
  WRONG_NUMBER: 'Wrong number',
  VOICEMAIL: 'Voicemail',
  DETAILS_EMAIL: 'Details (email)',
  DETAILS_WHATSAPP: 'Details (WhatsApp)',
  ANSWERED: 'Answered',
  UNKNOWN: 'Unknown',
}

export function callOutcomeLabel(outcome: string): string {
  if (!outcome) return '—'
  return OUTCOME_LABELS[outcome] ?? outcome
}

export function fmtDuration(sec: number | undefined): string {
  const s = Number(sec) || 0
  if (s < 60) return `${Math.round(s)}s`
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

export function fmtWhen(iso?: string): string {
  return iso ? String(iso).slice(0, 16).replace('T', ' ') : '—'
}
