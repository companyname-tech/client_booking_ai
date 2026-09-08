import type { TrainingExtractedData, TrainingIntendedData } from '@/types/training'
import type { DismissedExtracted } from '@/lib/trainingExtractedDismissed'

export type CompareStatus = 'match' | 'missing' | 'extra' | 'mismatch' | 'neutral'

export interface CompareRow {
  id: string
  field: string
  intended: string
  extracted: string
  status: CompareStatus
}

function normEmail(value: string): string {
  return value.trim().toLowerCase()
}

function normPhone(value: string): string {
  return value.replace(/\D/g, '')
}

function normDay(value: string): string {
  return value.trim().toLowerCase()
}

function normTime(value: string): string {
  const raw = value.trim()
  const m = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return raw.toLowerCase()
  return `${Number(m[1]).toString().padStart(2, '0')}:${m[2]}`
}

export function filterExtracted(
  extracted?: TrainingExtractedData,
  dismissed?: DismissedExtracted,
): TrainingExtractedData {
  const emails = (extracted?.emails ?? []).filter(
    (row) => !dismissed?.emails.includes(normEmail(row.email)),
  )
  const phones = (extracted?.phones ?? []).filter(
    (row) => !dismissed?.phones.includes(normPhone(row)),
  )
  const meeting =
    dismissed?.meeting || !extracted?.meeting
      ? null
      : extracted.meeting
  return { emails, phones, meeting }
}

export function buildExtractedCompareRows(
  intended: TrainingIntendedData,
  extracted?: TrainingExtractedData,
): CompareRow[] {
  const rows: CompareRow[] = []
  const extEmails = (extracted?.emails ?? []).map((row) => normEmail(row.email))
  const intendedEmails = intended.emails.map(normEmail).filter(Boolean)

  for (const email of intendedEmails) {
    const hit = extEmails.includes(email)
    rows.push({
      id: `email-intended-${email}`,
      field: 'Email',
      intended: email,
      extracted: hit ? email : '—',
      status: hit ? 'match' : 'missing',
    })
  }
  for (const row of extracted?.emails ?? []) {
    const email = normEmail(row.email)
    if (!email || intendedEmails.includes(email)) continue
    rows.push({
      id: `email-extra-${email}`,
      field: 'Email',
      intended: '—',
      extracted: row.email,
      status: 'extra',
    })
  }

  const extPhones = (extracted?.phones ?? []).map(normPhone)
  const intendedPhones = intended.phones.map(normPhone).filter(Boolean)
  for (const phone of intendedPhones) {
    const hit = extPhones.includes(phone)
    rows.push({
      id: `phone-intended-${phone}`,
      field: 'Phone',
      intended: phone,
      extracted: hit ? (extracted?.phones?.find((row) => normPhone(row) === phone) ?? phone) : '—',
      status: hit ? 'match' : 'missing',
    })
  }
  for (const phone of extracted?.phones ?? []) {
    const norm = normPhone(phone)
    if (!norm || intendedPhones.includes(norm)) continue
    rows.push({
      id: `phone-extra-${norm}`,
      field: 'Phone',
      intended: '—',
      extracted: phone,
      status: 'extra',
    })
  }

  const intendedDay = normDay(intended.meeting?.day ?? '')
  const intendedTime = normTime(intended.meeting?.time ?? '')
  const extractedDay = normDay(extracted?.meeting?.day ?? '')
  const extractedTime = normTime(extracted?.meeting?.time ?? '')
  const hasIntendedMeeting = !!(intendedDay || intendedTime)
  const hasExtractedMeeting = !!(extractedDay || extractedTime)

  if (hasIntendedMeeting || hasExtractedMeeting) {
    const intendedLabel = [intended.meeting?.day, intended.meeting?.time].filter(Boolean).join(' · ') || '—'
    const extractedLabel = [extracted?.meeting?.day, extracted?.meeting?.time].filter(Boolean).join(' · ') || '—'
    let status: CompareStatus = 'neutral'
    if (hasIntendedMeeting && hasExtractedMeeting) {
      const dayOk = !intendedDay || !extractedDay || intendedDay === extractedDay
      const timeOk = !intendedTime || !extractedTime || intendedTime === extractedTime
      status = dayOk && timeOk ? 'match' : 'mismatch'
    } else if (hasIntendedMeeting) {
      status = 'missing'
    } else {
      status = 'extra'
    }
    rows.push({
      id: 'meeting',
      field: 'Meeting',
      intended: intendedLabel,
      extracted: extractedLabel,
      status,
    })
  }

  return rows
}
