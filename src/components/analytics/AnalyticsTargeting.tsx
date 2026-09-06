import { useState } from 'react'
import type { TargetingRow } from '@/types/campaignAnalytics'
import { formatNumber, formatPercent } from '@/lib/utils'
import { Tabs } from '@/components/ui/Tabs'
import { AnalyticsSection } from './AnalyticsShared'
import { cn } from '@/lib/utils'

type Tab = 'industries' | 'companySizes' | 'jobTitles' | 'ageGroups' | 'locations'

function TargetingTable({ rows, showShare }: { rows: TargetingRow[]; showShare?: boolean }) {
  return (
  <>
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-fg-muted">
            <th className="pb-2 font-medium">Segment</th>
            {showShare && <th className="pb-2 font-medium">Share</th>}
            <th className="pb-2 font-medium">Leads</th>
            <th className="pb-2 font-medium">Calls</th>
            <th className="pb-2 font-medium">Bookings</th>
            <th className="pb-2 font-medium">Booking rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className={cn('border-b border-line/60', r.highlight && 'bg-accent-soft/5')}>
              <td className="py-2.5 font-medium text-fg">{r.label}{r.highlight && <span className="ml-2 text-2xs text-accent">Best</span>}</td>
              {showShare && <td className="py-2.5 tabular text-fg-secondary">{r.share}%</td>}
              <td className="py-2.5 tabular text-fg-secondary">{formatNumber(r.leads)}</td>
              <td className="py-2.5 tabular text-fg-secondary">{formatNumber(r.calls)}</td>
              <td className="py-2.5 tabular text-fg-secondary">{formatNumber(r.bookings)}</td>
              <td className="py-2.5 tabular font-medium text-fg">{formatPercent(r.bookingRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="space-y-2 md:hidden">
      {rows.map((r) => (
        <div key={r.label} className={cn('rounded-lg border border-line p-3', r.highlight && 'border-accent/30')}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-fg">{r.label}</span>
            <span className="text-sm font-semibold tabular">{formatPercent(r.bookingRate)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-2xs text-fg-muted">
            <span>{formatNumber(r.leads)} leads</span>
            <span>{formatNumber(r.bookings)} bookings</span>
          </div>
        </div>
      ))}
    </div>
  </>
  )
}

function HorizontalBars({ rows }: { rows: TargetingRow[] }) {
  const max = Math.max(...rows.map((r) => r.bookingRate), 1)
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-fg">{r.label}</span>
            <span className="tabular text-fg-secondary">{formatPercent(r.bookingRate)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className={cn('h-full rounded-full transition-all', r.highlight ? 'bg-accent' : 'bg-violet/70')} style={{ width: `${(r.bookingRate / max) * 100}%` }} />
          </div>
          <div className="mt-1 text-2xs text-fg-muted">{formatNumber(r.leads)} leads · {formatNumber(r.bookings)} bookings</div>
        </div>
      ))}
    </div>
  )
}

export function TargetingAnalysis({ targeting }: { targeting: { industries: TargetingRow[]; companySizes: TargetingRow[]; jobTitles: TargetingRow[]; ageGroups: TargetingRow[]; locations: TargetingRow[] } }) {
  const [tab, setTab] = useState<Tab>('industries')
  const tabs = [
    { id: 'industries' as const, label: 'Industry' },
    { id: 'companySizes' as const, label: 'Company size' },
    { id: 'jobTitles' as const, label: 'Job title' },
    { id: 'ageGroups' as const, label: 'Age' },
    { id: 'locations' as const, label: 'Location' },
  ]
  const rows = targeting[tab]
  return (
    <AnalyticsSection title="Targeting analysis" description="Performance breakdown by segment">
      <Tabs items={tabs} value={tab} onChange={setTab} aria-label="Targeting dimensions" className="mb-4" />
      <TargetingTable rows={rows} showShare={tab === 'industries'} />
    </AnalyticsSection>
  )
}

export function IndustryPerformance({ rows }: { rows: TargetingRow[] }) {
  return (
    <AnalyticsSection title="Industry performance" description="Booking outcomes by vertical">
      <HorizontalBars rows={rows} />
    </AnalyticsSection>
  )
}

export function CompanySizePerformance({ rows }: { rows: TargetingRow[] }) {
  const best = rows.find((r) => r.highlight)
  return (
    <AnalyticsSection title="Company size analysis">
      <HorizontalBars rows={rows} />
      {best && (
        <div className="mt-4 rounded-md border border-success/20 bg-success-soft/10 px-3 py-2 text-sm">
          <span className="font-medium text-success">Best performing:</span> {best.label}
        </div>
      )}
    </AnalyticsSection>
  )
}

export function GeographicPerformance({ rows }: { rows: TargetingRow[] }) {
  return (
    <AnalyticsSection title="Geographic performance" description="Ranked by booking rate">
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5">
            <span className="w-5 text-xs font-semibold tabular text-fg-muted">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-fg">{r.label}</div>
              <div className="text-2xs text-fg-muted">{formatNumber(r.leads)} leads · {formatNumber(r.bookings)} bookings</div>
            </div>
            <span className="text-sm font-semibold tabular text-fg">{formatPercent(r.bookingRate)}</span>
          </li>
        ))}
      </ol>
    </AnalyticsSection>
  )
}

export function AgePerformance({ rows }: { rows: TargetingRow[] }) {
  const best = rows.find((r) => r.highlight)
  return (
    <AnalyticsSection title="Age analysis">
      <HorizontalBars rows={rows} />
      {best && <p className="mt-3 text-sm text-fg-muted">Best performing age range: <span className="font-medium text-fg">{best.label}</span></p>}
    </AnalyticsSection>
  )
}

export function JobTitlePerformance({ rows }: { rows: TargetingRow[] }) {
  return (
    <AnalyticsSection title="Job title performance">
      <HorizontalBars rows={rows} />
    </AnalyticsSection>
  )
}
