import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'

const CHANGE_AREAS = ['Targeting', 'Offer', 'Budget', 'Booking', 'Integrations', 'Other'] as const

export function RequestChangesModal({
  open,
  onClose,
  onSubmit,
  clientName,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (areas: string[], message: string) => void
  clientName: string
}) {
  const [areas, setAreas] = useState<string[]>([])
  const [message, setMessage] = useState('')

  const toggle = (a: string) => setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request changes"
      description={`Send feedback to ${clientName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!message.trim()} onClick={() => { onSubmit(areas, message); onClose() }}>
            Send to Client
          </Button>
        </>
      }
    >
      <div className="space-y-4 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {CHANGE_AREAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggle(a)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${areas.includes(a) ? 'border-accent bg-accent-soft text-accent' : 'border-line text-fg-muted'}`}
            >
              {a}
            </button>
          ))}
        </div>
        <Textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please clarify the target company size and update the offer CTA."
        />
      </div>
    </Modal>
  )
}

export function RejectCampaignModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (reason: string, detail: string) => void
}) {
  const [reason, setReason] = useState('Compliance concern')
  const [detail, setDetail] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject campaign"
      description="This action cannot be undone."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="bg-danger hover:bg-danger/90" disabled={!detail.trim()} onClick={() => { onSubmit(reason, detail); onClose() }}>
            Reject Campaign
          </Button>
        </>
      }
    >
      <div className="space-y-4 px-5 py-4">
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm">
          {['Compliance concern', 'Insufficient targeting', 'Offer unclear', 'Budget mismatch', 'Other'].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <Textarea rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Explain why this campaign cannot be approved." />
      </div>
    </Modal>
  )
}

export function ApproveCampaignModal({
  open,
  onClose,
  onSubmit,
  campaignName,
  checks,
  complianceWarning,
}: {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  campaignName: string
  checks: string[]
  complianceWarning?: boolean
}) {
  const [success, setSuccess] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleApprove = () => {
    if (complianceWarning && !confirmed) {
      setConfirmed(true)
      return
    }
    setSuccess(true)
    window.setTimeout(() => {
      onSubmit()
      setSuccess(false)
      setConfirmed(false)
      onClose()
    }, 1200)
  }

  return (
    <Modal open={open} onClose={onClose} title={success ? 'Campaign approved' : 'Approve campaign?'} size="md">
      <div className="px-5 py-4">
        {success ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">✓</div>
            <p className="mt-4 font-medium text-fg">Campaign approved</p>
            <p className="mt-1 text-sm text-fg-muted">Entering launch queue…</p>
          </div>
        ) : (
          <>
            <p className="font-medium text-fg">{campaignName}</p>
            {complianceWarning && confirmed && (
              <p className="mt-3 rounded-md border border-warning/20 bg-warning-soft/10 px-3 py-2 text-sm text-warning">
                Compliance items are unresolved. Confirm you have completed human review before approving.
              </p>
            )}
            <ul className="mt-4 space-y-2">
              {checks.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm text-fg-secondary">
                  <span className="text-success">✓</span> {c}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-fg-muted">Once approved, the campaign will enter the launch queue.</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleApprove}>
                {complianceWarning && confirmed ? 'Confirm approval' : 'Approve & Launch'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
