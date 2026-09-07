import { useState } from 'react'
import { Download } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const OPTIONS = [
  'OfferCampaign summary',
  'Full analytics',
  'Lead data',
  'Call data',
  'AI insights',
] as const

export function AnalyticsExport() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(['OfferCampaign summary'])
  const [message, setMessage] = useState('')

  const toggle = (o: string) => setSelected((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o])

  const handleExport = () => {
    setMessage('Report generation will be available when connected to the backend.')
    window.setTimeout(() => { setOpen(false); setMessage('') }, 2500)
  }

  return (
    <>
      <Button variant="secondary" leadingIcon={<Download />} onClick={() => setOpen(true)}>Export report</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Export analytics"
        description="Select report sections to include"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleExport} disabled={selected.length === 0}>Generate report</Button>
          </>
        }
      >
        <div className="space-y-2 px-5 py-4">
          {OPTIONS.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-surface-2">
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="rounded border-line" />
              {o}
            </label>
          ))}
          {message && <p className="mt-3 text-sm text-accent" role="status">{message}</p>}
        </div>
      </Modal>
    </>
  )
}
