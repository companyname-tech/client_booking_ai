import type { TrainingRecordingComment } from '@/types/training'

const PREFIX = 'training-recording-comments:'

function key(sessionId: string): string {
  return `${PREFIX}${sessionId}`
}

export function loadRecordingComments(sessionId: string): TrainingRecordingComment[] {
  try {
    const raw = localStorage.getItem(key(sessionId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as TrainingRecordingComment[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRecordingComment(
  sessionId: string,
  input: Omit<TrainingRecordingComment, 'id' | 'createdAt'>,
): TrainingRecordingComment[] {
  const entry: TrainingRecordingComment = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  const rows = [entry, ...loadRecordingComments(sessionId)].slice(0, 50)
  localStorage.setItem(key(sessionId), JSON.stringify(rows))
  return rows
}

export function removeRecordingComment(sessionId: string, commentId: string): TrainingRecordingComment[] {
  const rows = loadRecordingComments(sessionId).filter((row) => row.id !== commentId)
  localStorage.setItem(key(sessionId), JSON.stringify(rows))
  return rows
}
