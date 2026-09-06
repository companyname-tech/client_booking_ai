import type { CampaignDraft } from '@/types/campaignDraft'
import type { ValidationErrors } from '@/lib/onboardingValidation'
import { FieldGroup, FieldLabel } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { BookingTitlePreview } from '../BookingTitlePreview'

const MEETING_TYPES = [
  { value: 'discovery' as const, label: 'Discovery' },
  { value: 'demo' as const, label: 'Demo' },
  { value: 'consultation' as const, label: 'Consultation' },
  { value: 'strategy' as const, label: 'Strategy' },
]

const DURATIONS = [
  { value: 15 as const, label: '15 min' },
  { value: 30 as const, label: '30 min' },
  { value: 45 as const, label: '45 min' },
  { value: 60 as const, label: '60 min' },
]

const CHANNELS = [
  { value: 'email' as const, label: 'Email' },
  { value: 'calendar' as const, label: 'Calendar' },
  { value: 'both' as const, label: 'Both' },
]

export function BookingStep({
  draft,
  errors,
  onChange,
}: {
  draft: CampaignDraft
  errors: ValidationErrors
  onChange: (patch: Partial<CampaignDraft['booking']>) => void
}) {
  const b = draft.booking

  return (
    <div className="space-y-6">
      <FieldGroup>
        <FieldLabel htmlFor="booking-email" required hint="Where should booking confirmations be sent?">
          Booking email
        </FieldLabel>
        <Input
          id="booking-email"
          type="email"
          value={b.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="you@company.com"
          error={!!errors.email}
        />
        {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
      </FieldGroup>

      <BookingTitlePreview
        draft={draft}
        onChange={(titleTemplate) => onChange({ titleTemplate })}
        error={errors.titleTemplate}
      />

      <SegmentedControl
        label="Meeting type"
        options={MEETING_TYPES}
        value={b.meetingType}
        onChange={(meetingType) => onChange({ meetingType })}
      />

      <SegmentedControl
        label="Meeting duration"
        options={DURATIONS.map((d) => ({ value: String(d.value), label: d.label }))}
        value={String(b.durationMin)}
        onChange={(v) => onChange({ durationMin: Number(v) as 15 | 30 | 45 | 60 })}
      />

      <SegmentedControl
        label="Notification channel"
        options={CHANNELS}
        value={b.notificationChannel}
        onChange={(notificationChannel) => onChange({ notificationChannel })}
      />
    </div>
  )
}
