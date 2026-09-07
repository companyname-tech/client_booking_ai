import { Pencil } from 'lucide-react'
import type { CampaignDraft } from '@/types/campaignDraft'
import { formatCurrency } from '@/lib/utils'
import { integrationStateMeta } from '@/lib/status'
import { Button } from '@/components/ui/Button'
import { CampaignReadiness } from '../CampaignReadiness'

export function ReviewStep({
  draft,
  onEditStep,
}: {
  draft: CampaignDraft
  onEditStep: (index: number) => void
}) {
  const t = draft.target
  const o = draft.offer
  const b = draft.budget
  const bk = draft.booking

  const sections = [
    {
      title: 'Target',
      index: 0,
      rows: [
        ['OfferCampaign', t.campaignName],
        ['Industries', t.industries.join(', ')],
        ['Company size', t.companySize],
        ['Geographies', t.geographies.join(', ')],
        ['Decision-makers', t.decisionMakers.join(', ')],
        ['Age range', `${t.ageMin}–${t.ageMax}`],
      ],
    },
    {
      title: 'Offer',
      index: 1,
      rows: [
        ['Offer name', o.offerName],
        ['Description', o.description],
        ['Benefits', o.benefits.join(', ') || '—'],
        ['Video', o.video ? o.video.name : 'Not uploaded'],
      ],
    },
    {
      title: 'Budget',
      index: 2,
      rows: [
        ['Total', formatCurrency(b.total)],
        ['Daily', formatCurrency(b.daily)],
        ['Duration', `${b.durationDays} days`],
      ],
    },
    {
      title: 'Booking',
      index: 3,
      rows: [
        ['Email', bk.email],
        ['Title template', bk.titleTemplate],
        ['Meeting type', bk.meetingType],
        ['Duration', `${bk.durationMin} min`],
        ['Notifications', bk.notificationChannel],
      ],
    },
    {
      title: 'Integrations',
      index: 4,
      rows: [
        ['Gmail', integrationStateMeta[draft.integrations.gmail].label],
        ['Calendly', integrationStateMeta[draft.integrations.calendly].label],
        ['Zoom', integrationStateMeta[draft.integrations.zoom].label],
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <CampaignReadiness draft={draft} />

      {sections.map((section) => (
        <div key={section.title} className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h3 className="text-sm font-semibold text-fg">{section.title}</h3>
            <Button variant="ghost" size="sm" leadingIcon={<Pencil />} onClick={() => onEditStep(section.index)}>
              Edit
            </Button>
          </div>
          <dl className="divide-y divide-line">
            {section.rows.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-xs text-fg-muted">{label}</dt>
                <dd className="text-sm font-medium text-fg sm:text-right">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
