import { useRef } from 'react'
import type { CampaignDraft } from '@/types/campaignDraft'
import { repo } from '@/data/repository'
import { cn } from '@/lib/utils'
import { FieldGroup, FieldLabel } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'

const VARIABLES = [
  { key: '{company}', label: 'company' },
  { key: '{client}', label: 'client' },
  { key: '{product}', label: 'product' },
  { key: '{date}', label: 'date' },
] as const

function renderPreview(template: string, draft: CampaignDraft): string {
  const client = repo.getCurrentClient()
  const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date())
  return template
    .replace(/\{company\}/g, client.name)
    .replace(/\{client\}/g, 'Sarah Johnson')
    .replace(/\{product\}/g, draft.offer.offerName || 'Product Name')
    .replace(/\{date\}/g, date)
}

export function BookingTitlePreview({
  draft,
  onChange,
  error,
}: {
  draft: CampaignDraft
  onChange: (template: string) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const preview = renderPreview(draft.booking.titleTemplate, draft)

  const insert = (token: string) => {
    const el = inputRef.current
    if (!el) {
      onChange(draft.booking.titleTemplate + token)
      return
    }
    const start = el.selectionStart ?? draft.booking.titleTemplate.length
    const end = el.selectionEnd ?? start
    const next = draft.booking.titleTemplate.slice(0, start) + token + draft.booking.titleTemplate.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <FieldGroup>
      <FieldLabel htmlFor="booking-title" hint="Choose how new bookings will appear in your inbox and calendar.">
        Booking notification title
      </FieldLabel>
      <Input
        ref={inputRef}
        id="booking-title"
        value={draft.booking.titleTemplate}
        onChange={(e) => onChange(e.target.value)}
        placeholder="{company} × {client} — {product}"
        error={!!error}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {VARIABLES.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => insert(v.key)}
            className="interactive rounded-sm bg-surface-3 px-2 py-0.5 font-mono text-2xs text-accent hover:bg-accent-soft"
          >
            {v.key}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-line bg-surface-1 px-3 py-2.5">
        <div className="label-caps mb-1">Preview</div>
        <p className={cn('text-sm font-medium text-fg', !preview.trim() && 'text-fg-faint')}>
          {preview.trim() || 'Preview will appear here'}
        </p>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </FieldGroup>
  )
}
