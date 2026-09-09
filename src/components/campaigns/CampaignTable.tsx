import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { OfferCampaign } from '@/types'
import { resolveCampaignDisplayStatus } from '@/lib/campaignOperationalStatus'
import { cn, formatCurrency, formatNumber, formatPercent, formatRelativeCompact } from '@/lib/utils'
import { NOW } from '@/data/time'
import { useIsWide } from '@/hooks/useMediaQuery'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Sparkline } from '@/components/ui/Sparkline'
import { CampaignStatus } from './CampaignStatus'
import { SelectCheckbox } from '@/components/ui/SelectCheckbox'
import { CopyableName } from '@/components/ui/CopyableName'

export interface CampaignSelection {
  selected: ReadonlySet<string>
  toggle: (id: string) => void
  allChecked: boolean
  someChecked: boolean
  toggleAll: () => void
}

export interface CampaignTableProps {
  campaigns: OfferCampaign[]
  zone?: 'client' | 'admin'
  className?: string
  /** Optional bulk-selection state — renders a checkbox column (admin lists). */
  selection?: CampaignSelection
  onCopied?: (label: string) => void
}

const progressTone = (c: OfferCampaign) => {
  const status = resolveCampaignDisplayStatus(c)
  return status === 'paused' ? 'neutral' : status === 'completed' ? 'info' : c.stage === 'calling' ? 'success' : 'violet'
}

const cell = 'px-3 py-3.5 first:pl-4'

function Th({ children, align = 'left', className }: { children: React.ReactNode; align?: 'left' | 'right'; className?: string }) {
  return (
    <th scope="col" className={cn('label-caps px-3 py-2.5 font-medium first:pl-4', align === 'right' && 'text-right', className)}>
      {children}
    </th>
  )
}

const Row = memo(function Row({
  campaign,
  onOpen,
  selected,
  onToggle,
  onCopied,
}: {
  campaign: OfferCampaign
  onOpen: () => void
  selected?: boolean
  onToggle?: (id: string) => void
  onCopied?: (label: string) => void
}) {
  const { metrics, budget } = campaign
  const displayStatus = resolveCampaignDisplayStatus(campaign)

  return (
    <Reveal
      as="tr"
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      aria-label={`Open ${campaign.name}`}
      className="group interactive ring-focus cursor-pointer border-t border-line outline-none hover:bg-white/[0.025] focus-visible:bg-white/[0.03]"
    >
      {onToggle ? (
        <td className="px-2 py-3.5 pl-4 align-middle">
          <SelectCheckbox checked={!!selected} onChange={() => onToggle(campaign.id)} label={`Select ${campaign.name}`} />
        </td>
      ) : null}
      <td className={cell}>
        <div className="flex items-center gap-2.5">
          <div className="min-w-0">
            <CopyableName
              name={campaign.name}
              id={campaign.id}
              compact
              rowHover
              className="text-sm font-medium text-fg"
              onCopied={onCopied}
            />
            <div className="truncate text-xs text-fg-muted">{campaign.targetAudience}</div>
          </div>
        </div>
      </td>
      <td className={cell}>
        <CampaignStatus status={displayStatus} />
      </td>
      <td className={cn(cell, 'text-right text-sm tabular text-fg-secondary')}>{formatNumber(metrics.leadsFound)}</td>
      <td className={cn(cell, 'text-right text-sm tabular text-fg-secondary')}>{formatNumber(metrics.callsCompleted)}</td>
      <td className={cn(cell, 'text-right')}>
        <div className="flex items-center justify-end gap-2">
          <Sparkline data={campaign.history} width={44} height={16} tone={progressTone(campaign)} area={false} animate={false} />
          <span className="text-sm font-medium tabular text-fg">{formatNumber(metrics.bookings)}</span>
        </div>
      </td>
      <td className={cn(cell, 'text-right text-sm tabular text-fg-secondary')}>
        {metrics.conversionRate ? formatPercent(metrics.conversionRate) : <span className="text-fg-faint">—</span>}
      </td>
      <td className={cn(cell, 'text-right')}>
        <div className="text-sm tabular text-fg-secondary">{formatCurrency(budget.used)}</div>
        <div className="text-2xs tabular text-fg-faint">of {formatCurrency(budget.total)}</div>
      </td>
      <td className={cell}>
        <div className="flex items-center gap-2">
          <ProgressBar value={campaign.progress} tone={progressTone(campaign)} size="xs" className="w-14" label={`${campaign.name} progress`} />
          <span className="w-8 text-right text-xs tabular text-fg-secondary">{campaign.progress}%</span>
        </div>
      </td>
      <td className={cn(cell, 'whitespace-nowrap text-right text-xs tabular text-fg-muted')}>
        {formatRelativeCompact(campaign.lastActivityAt, NOW)}
      </td>
      <td className="pr-3">
        <ChevronRight className="size-4 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg-secondary" />
      </td>
    </Reveal>
  )
})

const CardRow = memo(function CardRow({
  campaign,
  onOpen,
  selected,
  onToggle,
  onCopied,
}: {
  campaign: OfferCampaign
  onOpen: () => void
  selected?: boolean
  onToggle?: (id: string) => void
  onCopied?: (label: string) => void
}) {
  const { metrics, budget } = campaign
  const displayStatus = resolveCampaignDisplayStatus(campaign)
  return (
    <Reveal as="li" className="group">
      <div className="flex items-center gap-2 px-4 pt-3">
        {onToggle ? (
          <SelectCheckbox checked={!!selected} onChange={() => onToggle(campaign.id)} label={`Select ${campaign.name}`} />
        ) : (
          <span className="size-4" />
        )}
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CopyableName
              name={campaign.name}
              id={campaign.id}
              compact
              rowHover
              className="text-sm font-medium text-fg"
              onCopied={onCopied}
            />
            <div className="truncate text-xs text-fg-muted">{campaign.targetAudience}</div>
          </div>
          <CampaignStatus status={displayStatus} />
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="interactive ring-focus mt-3 flex w-full flex-col gap-3 rounded-md text-left outline-none hover:bg-white/[0.025]"
        >
          <dl className="grid w-full grid-cols-4 gap-2">
            {[
              ['Leads', formatNumber(metrics.leadsFound)],
              ['Calls', formatNumber(metrics.callsCompleted)],
              ['Bookings', formatNumber(metrics.bookings)],
              ['Conv.', metrics.conversionRate ? formatPercent(metrics.conversionRate) : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-2xs text-fg-muted">{k}</dt>
                <dd className="text-sm font-medium tabular text-fg">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex w-full items-center gap-3">
            <ProgressBar value={campaign.progress} tone={progressTone(campaign)} size="xs" className="flex-1" label={`${campaign.name} progress`} />
            <span className="text-xs tabular text-fg-secondary">{campaign.progress}%</span>
            <span className="text-2xs tabular text-fg-faint">
              {formatCurrency(budget.used)} / {formatCurrency(budget.total)}
            </span>
          </div>
        </button>
      </div>
    </Reveal>
  )
})

export function CampaignTable({ campaigns, zone = 'client', className, selection, onCopied }: CampaignTableProps) {
  const navigate = useNavigate()
  const isWide = useIsWide()
  const open = (id: string) => navigate(`/${zone}/campaigns/${id}`)

  if (!isWide) {
    return (
      <div className={cn('surface overflow-hidden', className)}>
        <Stagger as="ul" stagger={0.04} className="divide-y divide-line">
          {campaigns.map((c) => (
            <CardRow
              key={c.id}
              campaign={c}
              onOpen={() => open(c.id)}
              selected={selection?.selected.has(c.id)}
              onToggle={selection?.toggle}
              onCopied={onCopied}
            />
          ))}
        </Stagger>
      </div>
    )
  }

  return (
    <div className={cn('surface overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] table-fixed border-collapse">
          <colgroup>
            {selection ? <col className="w-10" /> : null}
            <col />
            <col className="w-40" />
            <col className="w-[76px]" />
            <col className="w-[76px]" />
            <col className="w-28" />
            <col className="w-16" />
            <col className="w-24" />
            <col className="w-[120px]" />
            <col className="w-[80px]" />
            <col className="w-8" />
          </colgroup>
          <thead>
            <tr>
              {selection ? (
                <th scope="col" className="px-2 py-2.5 pl-4">
                  <SelectCheckbox
                    checked={selection.allChecked}
                    indeterminate={selection.someChecked}
                    onChange={selection.toggleAll}
                    label="Select all campaigns"
                  />
                </th>
              ) : null}
              <Th>Offer Campaign</Th>
              <Th>Status</Th>
              <Th align="right">Leads</Th>
              <Th align="right">Calls</Th>
              <Th align="right">Bookings</Th>
              <Th align="right">Conv.</Th>
              <Th align="right">Budget</Th>
              <Th>Progress</Th>
              <Th align="right">Activity</Th>
              <th scope="col" aria-label="Open" />
            </tr>
          </thead>
          <Stagger as="tbody" stagger={0.03}>
            {campaigns.map((c) => (
              <Row
                key={c.id}
                campaign={c}
                onOpen={() => open(c.id)}
                selected={selection?.selected.has(c.id)}
                onToggle={selection?.toggle}
                onCopied={onCopied}
              />
            ))}
          </Stagger>
        </table>
      </div>
    </div>
  )
}
