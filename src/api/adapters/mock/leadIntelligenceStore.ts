import type { Lead, LeadStatus } from '@/types'
import type { LeadNote } from '@/types/leadIntelligence'

const notes = new Map<string, LeadNote[]>()
const tags = new Map<string, string[]>()
const statusOverrides = new Map<string, LeadStatus>()
const selectedIds = new Set<string>()

export function getLeadNotes(leadId: string): LeadNote[] {
  return notes.get(leadId) ?? []
}

export function addLeadNote(leadId: string, text: string): LeadNote {
  const note: LeadNote = {
    id: `note_${Date.now()}`,
    text,
    createdAt: new Date().toISOString(),
  }
  const list = notes.get(leadId) ?? []
  notes.set(leadId, [note, ...list])
  return note
}

export function updateLeadNote(leadId: string, noteId: string, text: string) {
  const list = notes.get(leadId) ?? []
  notes.set(leadId, list.map((n) => (n.id === noteId ? { ...n, text, updatedAt: new Date().toISOString() } : n)))
}

export function deleteLeadNote(leadId: string, noteId: string) {
  const list = notes.get(leadId) ?? []
  notes.set(leadId, list.filter((n) => n.id !== noteId))
}

export function getLeadTags(leadId: string): string[] {
  return tags.get(leadId) ?? []
}

export function setLeadTags(leadId: string, next: string[]) {
  tags.set(leadId, next)
}

export function toggleLeadTag(leadId: string, tag: string) {
  const current = getLeadTags(leadId)
  setLeadTags(leadId, current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag])
}

export function getLeadStatusOverride(leadId: string): LeadStatus | undefined {
  return statusOverrides.get(leadId)
}

export function setLeadStatus(leadId: string, status: LeadStatus) {
  statusOverrides.set(leadId, status)
}

export function getSelectedLeadIds(): string[] {
  return [...selectedIds]
}

export function toggleLeadSelection(id: string) {
  if (selectedIds.has(id)) selectedIds.delete(id)
  else selectedIds.add(id)
}

export function clearLeadSelection() {
  selectedIds.clear()
}

export function selectAllLeads(ids: string[]) {
  ids.forEach((id) => selectedIds.add(id))
}

export function applyLeadPatch(lead: Lead): Lead {
  const override = statusOverrides.get(lead.id)
  return override ? { ...lead, status: override } : lead
}
