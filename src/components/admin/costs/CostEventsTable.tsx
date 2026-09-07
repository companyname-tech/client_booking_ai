import type { CostEvent } from '@/types/costs'
import { fmtInt, fmtUSD, operationLabel, timeOfDay } from '@/lib/costs'
import { CostTable } from './CostTable'

export function CostEventsTable({ events }: { events: CostEvent[] }) {
  return (
    <div className="surface p-5">
      <h3 className="text-sm font-semibold text-fg">Recent events</h3>
      <div className="mt-3">
        <CostTable
          headers={['When', 'Operation', 'Model', 'In', 'Out', 'Audio', 'Tool', 'Cost']}
          rows={events.map((e) => [
            timeOfDay(e.created_at),
            operationLabel(e.operation ?? ''),
            e.model ?? '—',
            fmtInt(e.input_tokens),
            fmtInt(e.output_tokens),
            fmtInt((e.audio_input_tokens ?? 0) + (e.audio_output_tokens ?? 0)),
            fmtInt(e.tool_calls),
            fmtUSD(e.cost_usd),
          ])}
        />
      </div>
    </div>
  )
}
