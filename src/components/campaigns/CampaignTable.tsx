import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { OfferCampaign } from '@/types'
import { cn, formatCurrency, formatNumber, formatPercent, formatRelativeCompact } from '@/lib/utils'
import { NOW } from '@/data/time'
import { useIsWide } from '@/hooks/useMediaQuery'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Sparkline } from '@/components/ui/Sparkline'
import { CampaignStatus } from './CampaignStatus'
import { SelectCheckbox } from '@/components/ui/SelectCheckbox'

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
}

const progressTone = (c: OfferCampaign) =>
  c.status === 'paused' ? 'neutral' : c.status === 'completed' ? 'info' : c.stage === 'calling' ? 'success' : 'violet'

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
}: {
  campaign: OfferCampaign
  onOpen: () => void
  selected?: boolean
  onToggle?: (id: string) => void
}) {
  const { metrics, budget } = campaign

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
      <td className={cell}>
        <div className="flex items-center gap-2.5">
          {onToggle ? (
            <SelectCheckbox checked={!!selected} onChange={() => onToggle(campaign.id)} label={`Select ${campaign.name}`} />
          ) : null}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-fg">{campaign.name}</div>
            <div className="truncate text-xs text-fg-muted">{campaign.targetAudience}</div>
          </div>
        </div>
      </td>
      <td className={cell}>
        <CampaignStatus status={campaign.status} />
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
}: {
  campaign: OfferCampaign
  onOpen: () => void
  selected?: boolean
  onToggle?: (id: string) => void
}) {
  const { metrics, budget } = campaign
  return (
    <Reveal as="li">
      <div className="flex items-center gap-2 px-4 pt-3">
        {onToggle ? (
          <SelectCheckbox checked={!!selected} onChange={() => onToggle(campaign.id)} label={`Select ${campaign.name}`} />
        ) : (
          <span className="size-4" />
        )}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="interactive ring-focus flex w-full flex-col gap-3 px-4 py-4 text-left outline-none hover:bg-white/[0.025]"
      >
        <div className="flex w-full items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-fg">{campaign.name}</div>
            <div className="truncate text-xs text-fg-muted">{campaign.targetAudience}</div>
          </div>
          <CampaignStatus status={campaign.status} />
        </div>
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
    </Reveal>
  )
})

export function CampaignTable({ campaigns, zone = 'client', className, selection }: CampaignTableProps) {
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
              <Th>
                <span className="inline-flex items-center gap-2.5">
                  {selection ? (
                    <SelectCheckbox
                      checked={selection.allChecked}
                      indeterminate={selection.someChecked}
                      onChange={selection.toggleAll}
                      label="Select all campaigns"
                    />
                  ) : null}
                  OfferCampaign
                </span>
              </Th>
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
              />
            ))}
          </Stagger>
        </table>
      </div>
    </div>
  )
}
