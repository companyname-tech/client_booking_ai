import type { CampaignDraft } from '@/types/campaignDraft'
import type { ValidationErrors } from '@/lib/onboardingValidation'
import { BENEFIT_SUGGESTIONS } from '@/lib/onboarding'
import { FieldGroup, FieldLabel } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ChipInput } from '@/components/ui/ChipInput'
import { VideoUploader } from '../VideoUploader'

export function OfferStep({
  draft,
  errors,
  onChange,
}: {
  draft: CampaignDraft
  errors: ValidationErrors
  onChange: (patch: Partial<CampaignDraft['offer']>) => void
}) {
  const o = draft.offer

  return (
    <div className="space-y-6">
      <FieldGroup>
        <FieldLabel htmlFor="offer-name" required>
          Offer name
        </FieldLabel>
        <Input
          id="offer-name"
          value={o.offerName}
          onChange={(e) => onChange({ offerName: e.target.value })}
          placeholder="e.g. Free Strategy Session"
          error={!!errors.offerName}
        />
        {errors.offerName && <p className="mt-1 text-xs text-danger">{errors.offerName}</p>}
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="offer-description" required hint="What does the prospect get?">
          Offer description
        </FieldLabel>
        <Textarea
          id="offer-description"
          rows={3}
          value={o.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe the value proposition in plain language…"
          error={!!errors.description}
        />
        {errors.description && <p className="mt-1 text-xs text-danger">{errors.description}</p>}
      </FieldGroup>

      <ChipInput
        label="Key benefits"
        value={o.benefits}
        onChange={(benefits) => onChange({ benefits })}
        suggestions={BENEFIT_SUGGESTIONS}
        placeholder="Add a benefit and press Enter…"
      />

      <FieldGroup>
        <FieldLabel htmlFor="offer-pitch" required hint="How should the AI explain this offer on a call?">
          AI pitch script
        </FieldLabel>
        <Textarea
          id="offer-pitch"
          rows={4}
          value={o.pitch}
          onChange={(e) => onChange({ pitch: e.target.value })}
          placeholder="Write a natural-sounding pitch the AI can adapt…"
          error={!!errors.pitch}
        />
        {errors.pitch && <p className="mt-1 text-xs text-danger">{errors.pitch}</p>}
      </FieldGroup>

      <FieldGroup>
        <FieldLabel hint="Optional — a vertical video helps the AI understand your offer. Max 15 MB.">
          Offer video
        </FieldLabel>
        <VideoUploader value={o.video} onChange={(video) => onChange({ video })} />
      </FieldGroup>
    </div>
  )
}
