import type { CostSummary } from '@/types/costs'
import { fmtInt, fmtUSD, operationLabel } from '@/lib/costs'
import { CostTable } from './CostTable'

interface Bucket {
  key: string
  events?: number
  tokens?: number
  costUsd: number
}

function toBuckets(
  by: Record<string, { events?: number; input_tokens?: number; output_tokens?: number; cost_usd?: number }> | undefined,
): Bucket[] {
  return Object.entries(by ?? {})
    .map(([key, b]) => ({
      key,
      events: b.events,
      tokens: (b.input_tokens ?? 0) + (b.output_tokens ?? 0),
      costUsd: b.cost_usd ?? 0,
    }))
    .sort((a, b) => b.costUsd - a.costUsd)
}

export function CostBreakdown({ summary }: { summary: CostSummary | null }) {
  const ops = toBuckets(summary?.by_operation)
  const mods = toBuckets(summary?.by_model)
  const days = Object.entries(summary?.by_day ?? {})
  const maxDay = days.reduce((m, [, v]) => Math.max(m, Number(v) || 0), 0.0001)

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <h3 className="text-sm font-semibold text-fg">By operation</h3>
          <div className="mt-3">
            <CostTable
              headers={['Operation', 'Calls', 'Tokens', 'Cost']}
              rows={ops.map((b) => [
                operationLabel(b.key),
                fmtInt(b.events),
                fmtInt(b.tokens),
                fmtUSD(b.costUsd),
              ])}
            />
          </div>
        </div>
        <div className="surface p-5">
          <h3 className="text-sm font-semibold text-fg">By model</h3>
          <div className="mt-3">
            <CostTable
              headers={['Model', 'Calls', 'Cost']}
              rows={mods.map((b) => [b.key, fmtInt(b.events), fmtUSD(b.costUsd)])}
            />
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <h3 className="text-sm font-semibold text-fg">Spend per day</h3>
        {days.length === 0 ? (
          <p className="mt-2 text-sm text-fg-muted">No spend recorded yet.</p>
        ) : (
          <div className="mt-4 flex items-end gap-1.5" style={{ height: 96 }}>
            {days.map(([d, v]) => {
              const val = Number(v) || 0
              return (
                <div key={d} className="flex flex-1 flex-col items-center gap-1" title={`${d} — ${fmtUSD(val)}`}>
                  <span className="text-2xs text-fg-faint">{fmtUSD(val)}</span>
                  <div
                    className="w-full rounded-t bg-accent-strong/60"
                    style={{ height: `${Math.max(4, Math.round((val / maxDay) * 64))}px` }}
                  />
                  <span className="text-2xs text-fg-faint">{String(d).slice(5)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
