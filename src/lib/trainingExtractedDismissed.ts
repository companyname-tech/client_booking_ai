export interface DismissedExtracted {
  emails: string[]
  phones: string[]
  meeting: boolean
}

const PREFIX = 'training-extracted-dismissed:'

function key(sessionId: string): string {
  return `${PREFIX}${sessionId}`
}

export function emptyDismissed(): DismissedExtracted {
  return { emails: [], phones: [], meeting: false }
}

export function loadDismissedExtracted(sessionId: string): DismissedExtracted {
  if (!sessionId) return emptyDismissed()
  try {
    const raw = localStorage.getItem(key(sessionId))
    if (!raw) return emptyDismissed()
    const parsed = JSON.parse(raw) as DismissedExtracted
    return {
      emails: Array.isArray(parsed.emails) ? parsed.emails.map(String) : [],
      phones: Array.isArray(parsed.phones) ? parsed.phones.map(String) : [],
      meeting: Boolean(parsed.meeting),
    }
  } catch {
    return emptyDismissed()
  }
}

export function saveDismissedExtracted(sessionId: string, data: DismissedExtracted): DismissedExtracted {
  localStorage.setItem(key(sessionId), JSON.stringify(data))
  return data
}
