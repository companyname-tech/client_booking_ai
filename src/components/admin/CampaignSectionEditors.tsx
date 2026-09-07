/**
 * Inline editors for the campaign review screen (Super Admin → campaign →
 * Review). Each editor is self-contained: it drafts its section locally and
 * calls `onSave(payload)` only when the admin confirms, so the page can
 * persist through repo.updateCampaignOffer → PUT /offers/{id}.
 *
 * Sections that have no editable content (Overview, Integrations, Compliance,
 * Video, History) are intentionally not backed by an editor.
 */
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { FieldLabel } from '@/components/ui/Field'
import type { Agent } from '@/types'
import type { LeadCriteria } from '@/types'

export interface OfferDetailsDraft {
  title: string
  description: string
  pitch: string
  cta: string
}

export function OfferDetailsEditor({
  seed,
  saving,
  onSave,
  onCancel,
}: {
  seed: OfferDetailsDraft
  saving: boolean
  onSave: (draft: OfferDetailsDraft) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<OfferDetailsDraft>(seed)
  const dirty = JSON.stringify(draft) !== JSON.stringify(seed)
  const set = <K extends keyof OfferDetailsDraft>(key: K, value: OfferDetailsDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="review-offer-name">Offer name</FieldLabel>
          <Input id="review-offer-name" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="What the offer is called" />
        </div>
        <div>
          <FieldLabel htmlFor="review-offer-cta">Call to action</FieldLabel>
          <Input id="review-offer-cta" value={draft.cta} onChange={(e) => set('cta', e.target.value)} placeholder="e.g. Book a meeting" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="review-offer-pitch" hint="The core value proposition — what the AI agent pitches first.">
            Pitch (value proposition)
          </FieldLabel>
          <Textarea id="review-offer-pitch" value={draft.pitch} onChange={(e) => set('pitch', e.target.value)} placeholder="e.g. a new and updated website" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="review-offer-description">Description</FieldLabel>
          <Textarea id="review-offer-description" value={draft.description} onChange={(e) => set('description', e.target.value)} placeholder="Offer details and context" />
        </div>
      </div>
      <EditorActions dirty={dirty} saving={saving} onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  )
}

export function TargetingEditor({
  seed,
  saving,
  onSave,
  onCancel,
}: {
  seed: Partial<LeadCriteria>
  saving: boolean
  onSave: (draft: Partial<LeadCriteria>) => void
  onCancel: () => void
}) {
  const toText = (v?: string[]) => (v ?? []).join(', ')
  const [draft, setDraft] = useState<Partial<LeadCriteria>>(seed)
  const dirty = JSON.stringify(draft) !== JSON.stringify(seed)
  const set = <K extends keyof LeadCriteria>(key: K, value: LeadCriteria[K]) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="review-target-industry">Industries</FieldLabel>
          <Input id="review-target-industry" value={draft.industry ?? ''} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. Architecture, Construction" />
        </div>
        <div>
          <FieldLabel htmlFor="review-target-size">Company size</FieldLabel>
          <Input id="review-target-size" value={draft.companySize ?? ''} onChange={(e) => set('companySize', e.target.value)} placeholder="e.g. 11-50" />
        </div>
        <div>
          <FieldLabel htmlFor="review-target-age">Age range</FieldLabel>
          <Input id="review-target-age" value={draft.ageRange ?? ''} onChange={(e) => set('ageRange', e.target.value)} placeholder="e.g. 30-60" />
        </div>
        <div>
          <FieldLabel htmlFor="review-target-geo">Geography</FieldLabel>
          <Input id="review-target-geo" value={draft.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="e.g. IL, US" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="review-target-dm" hint="Comma-separated list of the decision-makers the AI should reach.">
            Decision-makers
          </FieldLabel>
          <Input id="review-target-dm" value={toText(draft.decisionMakers)} onChange={(e) => set('decisionMakers', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="e.g. Owner, CEO, CTO" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="review-target-other">Additional criteria</FieldLabel>
          <Textarea id="review-target-other" value={draft.other ?? ''} onChange={(e) => set('other', e.target.value)} placeholder="Any extra targeting notes for the AI" />
        </div>
      </div>
      <EditorActions dirty={dirty} saving={saving} onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  )
}

export interface BudgetDraft {
  total: number
  daily: number
  expectedDurationDays: number
}

export function BudgetEditor({
  seed,
  saving,
  onSave,
  onCancel,
}: {
  seed: BudgetDraft
  saving: boolean
  onSave: (draft: BudgetDraft) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<BudgetDraft>(seed)
  const dirty = JSON.stringify(draft) !== JSON.stringify(seed)
  const setNum = (key: keyof BudgetDraft, raw: string) => {
    const n = Number(raw.replace(/[^0-9.]/g, ''))
    setDraft((d) => ({ ...d, [key]: Number.isFinite(n) ? n : 0 }))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="review-budget-total">Total budget ($)</FieldLabel>
          <Input id="review-budget-total" inputMode="decimal" value={draft.total ? String(draft.total) : ''} onChange={(e) => setNum('total', e.target.value)} placeholder="0" />
        </div>
        <div>
          <FieldLabel htmlFor="review-budget-daily">Daily budget ($)</FieldLabel>
          <Input id="review-budget-daily" inputMode="decimal" value={draft.daily ? String(draft.daily) : ''} onChange={(e) => setNum('daily', e.target.value)} placeholder="0" />
        </div>
        <div>
          <FieldLabel htmlFor="review-budget-days">Duration (days)</FieldLabel>
          <Input id="review-budget-days" inputMode="numeric" value={draft.expectedDurationDays ? String(draft.expectedDurationDays) : ''} onChange={(e) => setNum('expectedDurationDays', e.target.value)} placeholder="0" />
        </div>
      </div>
      <EditorActions dirty={dirty} saving={saving} onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  )
}

export interface BookingDraft {
  titleTemplate: string
  email: string
}

export function BookingEditor({
  seed,
  saving,
  onSave,
  onCancel,
}: {
  seed: BookingDraft
  saving: boolean
  onSave: (draft: BookingDraft) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<BookingDraft>(seed)
  const dirty = JSON.stringify(draft) !== JSON.stringify(seed)
  const set = <K extends keyof BookingDraft>(key: K, value: string) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="review-booking-title" hint="Placeholders such as {company} are replaced when the booking is created.">
            Booking title template
          </FieldLabel>
          <Input id="review-booking-title" value={draft.titleTemplate} onChange={(e) => set('titleTemplate', e.target.value)} placeholder="{company} × {client} — {product}" className="font-mono" />
        </div>
        <div>
          <FieldLabel htmlFor="review-booking-email">Booking destination email</FieldLabel>
          <Input id="review-booking-email" type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} placeholder="bookings@client.com" />
        </div>
      </div>
      <EditorActions dirty={dirty} saving={saving} onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  )
}

export function AgentSelectEditor({
  agents,
  seedAgentId,
  saving,
  onSave,
  onCancel,
}: {
  agents: Agent[]
  seedAgentId: string
  saving: boolean
  onSave: (agentId: string) => void
  onCancel: () => void
}) {
  const [agentId, setAgentId] = useState(seedAgentId)
  const dirty = agentId !== seedAgentId
  const selected = agents.find((a) => a.id === agentId)

  return (
    <div className="space-y-4">
      <div className="max-w-md text-sm">
        <FieldLabel htmlFor="review-agent-select" hint="The agent runs this campaign's calls. Voice, language and persona are configured on the agent itself.">
          Assigned AI agent
        </FieldLabel>
        <select
          id="review-agent-select"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="interactive w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-fg focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25"
        >
          <option value="">Choose an agent…</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || a.id}
            </option>
          ))}
        </select>
        {selected && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-fg-secondary">
            <div className="capitalize">Voice</div>
            <div>{selected.voice || 'default'}</div>
            <div>Language</div>
            <div>{selected.language || 'default'}</div>
            {selected.role_label && (
              <>
                <div>Role</div>
                <div>{selected.role_label}</div>
              </>
            )}
          </dl>
        )}
      </div>
      <EditorActions dirty={dirty} saving={saving} onSave={() => onSave(agentId)} onCancel={onCancel} />
    </div>
  )
}

function EditorActions({
  dirty,
  saving,
  onSave,
  onCancel,
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
      <Button variant="primary" size="sm" disabled={!dirty || saving} onClick={onSave}>
        {saving ? 'Saving…' : dirty ? 'Save changes' : 'No changes yet'}
      </Button>
      <Button variant="ghost" size="sm" disabled={saving} onClick={onCancel}>
        Cancel
      </Button>
      {dirty && <span className="text-xs text-fg-muted">Unsaved edits — save before approving the campaign.</span>}
    </div>
  )
}
