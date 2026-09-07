import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BulkActionBarProps {
  count: number
  noun: string // e.g. "leads" — used for the "N leads selected" label
  onClear: () => void
  onDelete?: () => void
  deleteDisabled?: boolean
  deleteHint?: string // shown when delete is disabled (e.g. pending backend endpoint)
  busy?: boolean
}

/** Floating bulk action bar shown while rows are selected. */
export function BulkActionBar({ count, noun, onClear, onDelete, deleteDisabled, deleteHint, busy }: BulkActionBarProps) {
  if (count === 0) return null

  return (
    <div className="hairline-b sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-x-0 border-t-0 bg-surface-1/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
      <span className="text-sm font-medium text-fg">
        {count} {noun} selected
      </span>
      <Button variant="ghost" size="sm" leadingIcon={<X className="size-3.5" />} onClick={onClear} disabled={busy}>
        Clear
      </Button>
      <div className="ml-auto flex items-center gap-2">
        {onDelete ? (
          <Button
            variant="danger"
            size="sm"
            leadingIcon={<Trash2 className="size-3.5" />}
            onClick={onDelete}
            disabled={deleteDisabled || busy}
            title={deleteDisabled ? deleteHint : undefined}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface-2 px-2 py-1 text-2xs text-fg-muted">
            <Trash2 className="size-3" />
            {deleteHint ?? 'Delete pending backend endpoint'}
          </span>
        )}
      </div>
    </div>
  )
}
