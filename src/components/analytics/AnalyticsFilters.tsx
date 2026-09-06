import type { AnalyticsFilters, CampaignAnalyticsData } from '@/types/campaignAnalytics'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value?: string
  options: string[]
  onChange: (v: string | undefined) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-fg-muted">{label}</span>
      <select
        value={value ?? 'All'}
        onChange={(e) => onChange(e.target.value === 'All' ? undefined : e.target.value)}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  )
}

export function AnalyticsFiltersPanel({
  open,
  onClose,
  filters,
  options,
  onChange,
  onClear,
}: {
  open: boolean
  onClose: () => void
  filters: AnalyticsFilters
  options: CampaignAnalyticsData['filterOptions']
  onChange: (patch: Partial<AnalyticsFilters>) => void
  onClear: () => void
}) {
  return (
    <Drawer open={open} onClose={onClose} label="Analytics filters" className="w-[min(92vw,360px)]">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <FilterSelect label="Industry" value={filters.industry} options={options.industries} onChange={(v) => onChange({ industry: v })} />
        <FilterSelect label="Company size" value={filters.companySize} options={options.companySizes} onChange={(v) => onChange({ companySize: v })} />
        <FilterSelect label="Location" value={filters.location} options={options.locations} onChange={(v) => onChange({ location: v })} />
        <FilterSelect label="Job title" value={filters.jobTitle} options={options.jobTitles} onChange={(v) => onChange({ jobTitle: v })} />
        <FilterSelect label="Age" value={filters.age} options={options.ages} onChange={(v) => onChange({ age: v })} />
        <FilterSelect label="Lead status" value={filters.leadStatus} options={options.leadStatuses} onChange={(v) => onChange({ leadStatus: v })} />
        <FilterSelect label="Segment" value={filters.segment} options={options.segments} onChange={(v) => onChange({ segment: v })} />
      </div>
      <div className="border-t border-line p-4">
        <Button variant="primary" className="w-full" onClick={onClose}>Apply filters</Button>
      </div>
    </Drawer>
  )
}

export function countActiveFilters(filters: AnalyticsFilters): number {
  return [filters.industry, filters.companySize, filters.location, filters.jobTitle, filters.age, filters.leadStatus, filters.segment].filter(Boolean).length
}
