import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Danger confirm dialog for destructive bulk actions. */
export function ConfirmDialog({ open, title, body, confirmLabel = 'Delete', busy, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={body}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      }
    >
    </Modal>
  )
}
