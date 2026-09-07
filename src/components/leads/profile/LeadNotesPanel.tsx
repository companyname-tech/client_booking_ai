import { useState } from 'react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { LeadNote } from '@/types/leadIntelligence'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'

export function LeadNotesPanel({ leadId }: { leadId: string }) {
  const { data: notes, loading, error, reload } = useAsyncData(() => repo.getLeadNotes(leadId), [leadId])
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const add = async () => {
    if (!text.trim()) return
    await repo.addLeadNote(leadId, text.trim())
    setText('')
    reload()
  }

  const save = async (noteId: string) => {
    await repo.updateLeadNote(leadId, noteId, editText)
    setEditing(null)
    reload()
  }

  const remove = async (noteId: string) => {
    await repo.deleteLeadNote(leadId, noteId)
    reload()
  }

  if (loading) return <LoadingState rows={3} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const list: LeadNote[] = notes ?? []

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-surface-1 p-4">
        <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note about this prospect…" />
        <Button variant="primary" size="sm" className="mt-2" onClick={add} disabled={!text.trim()}>Add note</Button>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-fg-muted">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => (
            <li key={n.id} className="rounded-lg border border-line bg-surface-2 p-4">
              {editing === n.id ? (
                <>
                  <Textarea rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => save(n.id)}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-fg-secondary">{n.text}</p>
                  <div className="mt-2 flex items-center justify-between text-2xs text-fg-muted">
                    <time>{new Date(n.createdAt).toLocaleString()}</time>
                    <div className="flex gap-2">
                      <button type="button" className="text-accent" onClick={() => { setEditing(n.id); setEditText(n.text) }}>Edit</button>
                      <button type="button" className="text-danger" onClick={() => remove(n.id)}>Delete</button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
