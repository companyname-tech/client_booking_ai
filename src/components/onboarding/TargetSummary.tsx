import type { CampaignDraft } from '@/types/campaignDraft'
import { targetingConfidence } from '@/lib/onboardingValidation'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { OnboardingSummaryPanel } from './OnboardingSummaryPanel'

export function TargetSummary({ draft }: { draft: CampaignDraft }) {
  const t = draft.target
  const confidence = targetingConfidence(draft)

  const lines = [
    t.industries.length ? t.industries.join(', ') : null,
    t.geographies.join(', ') || null,
    t.companySize ? `${t.companySize} employees` : null,
    t.decisionMakers.length ? t.decisionMakers.join(' / ') : null,
    `Age ${t.ageMin}–${t.ageMax}`,
  ].filter(Boolean)

  return (
    <OnboardingSummaryPanel title="Your ideal lead">
      {lines.length === 0 ? (
        <p className="text-sm text-fg-muted">Start defining your target to see a live summary.</p>
      ) : (
        <ul className="space-y-2 text-sm text-fg-secondary">
          {lines.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 border-t border-line pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-fg-muted">AI targeting confidence</span>
          <AnimatedNumber value={confidence} format={(n) => `${Math.round(n)}%`} className="font-semibold text-violet" />
        </div>
        <ProgressBar value={confidence} tone="violet" size="xs" className="mt-2 w-full" label="AI targeting confidence" />
        <p className="mt-2 text-2xs text-fg-faint">Illustrative score based on targeting completeness.</p>
      </div>
    </OnboardingSummaryPanel>
  )
}
