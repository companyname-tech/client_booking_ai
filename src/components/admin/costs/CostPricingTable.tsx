import type { CostPricing } from '@/types/costs'
import { CostTable } from './CostTable'

export function CostPricingTable({ pricing }: { pricing: CostPricing | null }) {
  const entries = Object.entries(pricing?.models ?? {})
  const meta = `${pricing?.as_of ? `as of ${pricing.as_of} — ` : ''}${pricing?.source ?? ''}`

  return (
    <div className="surface p-5">
      <h3 className="text-sm font-semibold text-fg">
        Price table{' '}
        <span className="font-normal text-xs text-fg-muted">USD per 1M tokens — {meta}</span>
      </h3>
      <div className="mt-3">
        <CostTable
          headers={['Model', 'In $/1M', 'Out $/1M', 'Cached $/1M', 'Audio in $/1M', 'Audio out $/1M', 'Web search $/1K']}
          rows={entries.map(([name, m]) => [
            name,
            m.input_per_1m ?? '—',
            m.output_per_1m ?? '—',
            m.cached_input_per_1m ?? '—',
            m.audio_input_per_1m ?? '—',
            m.audio_output_per_1m ?? '—',
            m.web_search_per_1k ?? '—',
          ])}
        />
      </div>
    </div>
  )
}
