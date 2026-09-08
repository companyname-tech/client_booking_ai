import type { TrainingProcessOperation } from '@/types/training'

const STORAGE_PREFIX = 'training-process-ops:'
const MAX_ROWS = 100

function storageKey(offerId: string): string {
  return `${STORAGE_PREFIX}${offerId}`
}

function preview(body: unknown, limit = 240): string {
  try {
    const text = typeof body === 'string' ? body : JSON.stringify(body)
    if (text.length <= limit) return text
    return `${text.slice(0, limit - 1)}…`
  } catch {
    return String(body ?? '')
  }
}

export function processRequestPath(offerId: string): string {
  return `/admin/campaigns/${offerId}/training/process`
}

export function loadLocalTrainingProcessOperations(offerId: string): TrainingProcessOperation[] {
  try {
    const raw = localStorage.getItem(storageKey(offerId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as TrainingProcessOperation[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalTrainingProcessOperations(
  offerId: string,
  operations: TrainingProcessOperation[],
): void {
  const trimmed = operations.slice(0, MAX_ROWS)
  localStorage.setItem(storageKey(offerId), JSON.stringify(trimmed))
}

export function clearLocalTrainingProcessOperations(offerId: string): void {
  localStorage.removeItem(storageKey(offerId))
}

export function buildTrainingProcessOperation(input: {
  offerId: string
  method: 'GET' | 'DELETE'
  status: number
  statusText: string
  durationMs: number
  responseBody: Record<string, unknown>
  operationId?: string
  modelComment?: string
  createdAt?: string
}): TrainingProcessOperation {
  const now = new Date().toISOString()
  const operationId = input.operationId ?? crypto.randomUUID()
  const existing = loadLocalTrainingProcessOperations(input.offerId).find(
    (row) => row.operationId === operationId,
  )
  return {
    operationId,
    method: input.method,
    path: processRequestPath(input.offerId),
    status: input.status,
    statusText: input.statusText,
    durationMs: input.durationMs,
    responsePreview: preview(input.responseBody),
    responseBody: input.responseBody,
    modelComment: input.modelComment ?? existing?.modelComment ?? '',
    createdAt: input.createdAt ?? existing?.createdAt ?? now,
    lastRunAt: now,
  }
}

export function upsertLocalTrainingProcessOperation(
  offerId: string,
  operation: TrainingProcessOperation,
): TrainingProcessOperation[] {
  const rows = loadLocalTrainingProcessOperations(offerId).filter(
    (row) => row.operationId !== operation.operationId,
  )
  rows.unshift(operation)
  saveLocalTrainingProcessOperations(offerId, rows)
  return rows
}

export function removeLocalTrainingProcessOperation(
  offerId: string,
  operationId: string,
): TrainingProcessOperation[] {
  const rows = loadLocalTrainingProcessOperations(offerId).filter(
    (row) => row.operationId !== operationId,
  )
  saveLocalTrainingProcessOperations(offerId, rows)
  return rows
}

export function updateLocalTrainingProcessOperationComment(
  offerId: string,
  operationId: string,
  comment: string,
): TrainingProcessOperation | null {
  const rows = loadLocalTrainingProcessOperations(offerId)
  const idx = rows.findIndex((row) => row.operationId === operationId)
  if (idx < 0) return null
  const updated = { ...rows[idx], modelComment: comment }
  rows[idx] = updated
  saveLocalTrainingProcessOperations(offerId, rows)
  return updated
}
