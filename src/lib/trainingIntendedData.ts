import type { TrainingIntendedData } from '@/types/training'

const PREFIX = 'training-intended-data:'

function key(campaignId: string): string {
  return `${PREFIX}${campaignId}`
}

export const emptyIntendedData = (): TrainingIntendedData => ({
  emails: [],
  phones: [],
  meeting: { day: '', time: '' },
})

export function loadIntendedData(campaignId: string): TrainingIntendedData {
  if (!campaignId) return emptyIntendedData()
  try {
    const raw = localStorage.getItem(key(campaignId))
    if (!raw) return emptyIntendedData()
    const parsed = JSON.parse(raw) as TrainingIntendedData
    return {
      emails: Array.isArray(parsed.emails) ? parsed.emails.map(String) : [],
      phones: Array.isArray(parsed.phones) ? parsed.phones.map(String) : [],
      meeting: {
        day: String(parsed.meeting?.day ?? ''),
        time: String(parsed.meeting?.time ?? ''),
      },
    }
  } catch {
    return emptyIntendedData()
  }
}

export function saveIntendedData(campaignId: string, data: TrainingIntendedData): TrainingIntendedData {
  const clean: TrainingIntendedData = {
    emails: data.emails.map((row) => row.trim()).filter(Boolean),
    phones: data.phones.map((row) => row.trim()).filter(Boolean),
    meeting: {
      day: data.meeting?.day?.trim() ?? '',
      time: data.meeting?.time?.trim() ?? '',
    },
  }
  localStorage.setItem(key(campaignId), JSON.stringify(clean))
  return clean
}
