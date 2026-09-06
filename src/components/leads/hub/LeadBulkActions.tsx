import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function LeadBulkActions({
  count,
  onAction,
  onClear,
}: {
  count: number
  onAction: (action: string) => void
  onClear: () => void
}) {
  const [confirm, setConfirm] = useState<string | null>(null)
  if (count === 0) return null

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-2 px-4 py-3">
        <span className="text-sm text-fg-secondary">{count} selected</span>
        <Button variant="ghost" size="sm" onClick={() => onAction('qualified')}>Mark qualified</Button>
        <Button variant="ghost" size="sm" onClick={() => onAction('tag')}>Add tag</Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirm('archive')}>Archive</Button>
        <Button variant="ghost" size="sm" onClick={() => onAction('export')}>Export</Button>
        <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
      </div>
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Archive leads?" footer={<><Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="primary" onClick={() => { onAction('archive'); setConfirm(null) }}>Archive</Button></>}>
        <p className="px-5 py-4 text-sm text-fg-muted">This is a mock action. {count} leads will be archived in the current session.</p>
      </Modal>
    </>
  )
}

export function LeadExportButton({ onExport }: { onExport: () => void }) {
  return <Button variant="secondary" size="sm" onClick={onExport}>Export leads</Button>
}
