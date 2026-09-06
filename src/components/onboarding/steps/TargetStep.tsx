import type { CampaignDraft } from '@/types/campaignDraft'
import type { ValidationErrors } from '@/lib/onboardingValidation'
import {
  COMPANY_SIZE_OPTIONS,
  DECISION_MAKER_OPTIONS,
  GEOGRAPHY_OPTIONS,
  INDUSTRY_OPTIONS,
} from '@/lib/onboarding'
import { FieldGroup, FieldLabel } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { RangeSlider } from '@/components/ui/RangeSlider'
import { TargetSummary } from '../TargetSummary'

export function TargetStep({
  draft,
  errors,
  onChange,
}: {
  draft: CampaignDraft
  errors: ValidationErrors
  onChange: (patch: Partial<CampaignDraft['target']>) => void
}) {
  const t = draft.target

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
      <div className="min-w-0 space-y-5">
        <FieldGroup>
          <FieldLabel htmlFor="campaign-name" required>
            Campaign name
          </FieldLabel>
          <Input
            id="campaign-name"
            value={t.campaignName}
            onChange={(e) => onChange({ campaignName: e.target.value })}
            placeholder="e.g. Q1 Architecture Outreach"
            error={!!errors.campaignName}
          />
          {errors.campaignName && <p className="mt-1 text-xs text-danger">{errors.campaignName}</p>}
        </FieldGroup>

        <MultiSelect
          label="Industries"
          required
          options={INDUSTRY_OPTIONS}
          value={t.industries}
          onChange={(industries) => onChange({ industries })}
          error={errors.industries}
        />

        <FieldGroup>
          <FieldLabel htmlFor="company-size" required>
            Company size
          </FieldLabel>
          <select
            id="company-size"
            value={t.companySize}
            onChange={(e) => onChange({ companySize: e.target.value })}
            className="interactive w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-fg focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            <option value="">Select company size…</option>
            {COMPANY_SIZE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o} employees
              </option>
            ))}
          </select>
          {errors.companySize && <p className="mt-1 text-xs text-danger">{errors.companySize}</p>}
        </FieldGroup>

        <MultiSelect
          label="Geographies"
          required
          options={GEOGRAPHY_OPTIONS}
          value={t.geographies}
          onChange={(geographies) => onChange({ geographies })}
          error={errors.geographies}
        />

        <MultiSelect
          label="Decision-makers"
          required
          options={DECISION_MAKER_OPTIONS}
          value={t.decisionMakers}
          onChange={(decisionMakers) => onChange({ decisionMakers })}
          error={errors.decisionMakers}
        />

        <RangeSlider
          label="Age range"
          min={18}
          max={80}
          valueMin={t.ageMin}
          valueMax={t.ageMax}
          onChange={(ageMin, ageMax) => onChange({ ageMin, ageMax })}
        />
        {errors.ageRange && <p className="-mt-3 text-xs text-danger">{errors.ageRange}</p>}

        <FieldGroup>
          <FieldLabel htmlFor="additional-criteria" hint="Optional — any extra targeting notes for the AI.">
            Additional criteria
          </FieldLabel>
          <Textarea
            id="additional-criteria"
            rows={3}
            value={t.additionalCriteria}
            onChange={(e) => onChange({ additionalCriteria: e.target.value })}
            placeholder="e.g. Must have an active website, prefer firms with 3+ partners…"
          />
        </FieldGroup>
      </div>

      <TargetSummary draft={draft} />
    </div>
  )
}
