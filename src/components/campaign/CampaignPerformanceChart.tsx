import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { CampaignPerformancePoint } from '@/types'
import { cn } from '@/lib/utils'

type Series = 'leads' | 'calls' | 'bookings'

const SERIES_COLORS: Record<Series, string> = {
  leads: 'var(--color-accent)',
  calls: 'var(--color-violet)',
  bookings: 'var(--color-success)',
}

export function CampaignPerformanceChart({
  data,
  className,
}: {
  data: CampaignPerformancePoint[]
  className?: string
}) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState<Set<Series>>(new Set(['leads', 'calls', 'bookings']))

  const { paths, width, height, padding } = useMemo(() => {
    const w = 600
    const h = 200
    const pad = { top: 12, right: 12, bottom: 28, left: 36 }
    const innerW = w - pad.left - pad.right
    const innerH = h - pad.top - pad.bottom

    const maxVal = Math.max(...data.flatMap((d) => [d.leads, d.calls, d.bookings]), 1)

    const toPath = (key: Series) => {
      const points = data.map((d, i) => {
        const x = pad.left + (i / Math.max(data.length - 1, 1)) * innerW
        const y = pad.top + innerH - (d[key] / maxVal) * innerH
        return `${i === 0 ? 'M' : 'L'}${x},${y}`
      })
      return points.join(' ')
    }

    return {
      width: w,
      height: h,
      padding: pad,
      paths: { leads: toPath('leads'), calls: toPath('calls'), bookings: toPath('bookings') },
      maxVal,
      innerW,
      innerH,
    }
  }, [data])

  const toggle = (s: Series) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(s)) {
        if (next.size > 1) next.delete(s)
      } else next.add(s)
      return next
    })
  }

  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-3 flex flex-wrap gap-2">
        {(['leads', 'calls', 'bookings'] as Series[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={cn(
              'interactive rounded-full border px-2.5 py-0.5 text-2xs font-medium capitalize transition-colors',
              active.has(s) ? 'border-line-strong bg-surface-3 text-fg' : 'border-line text-fg-faint',
            )}
          >
            <span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ background: SERIES_COLORS[s] }} />
            {s}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-full" role="img" aria-label="Offer Campaign performance chart">
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + (height - padding.top - padding.bottom) * (1 - pct)}
            y2={padding.top + (height - padding.top - padding.bottom) * (1 - pct)}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
        ))}
        {(['leads', 'calls', 'bookings'] as Series[]).map((s) =>
          active.has(s) ? (
            <motion.path
              key={s}
              d={paths[s]}
              fill="none"
              stroke={SERIES_COLORS[s]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : null,
        )}
        {data.map((d, i) => (
          <text
            key={d.date}
            x={padding.left + (i / Math.max(data.length - 1, 1)) * (width - padding.left - padding.right)}
            y={height - 6}
            textAnchor="middle"
            className="fill-fg-faint text-[9px]"
          >
            {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ))}
      </svg>
    </div>
  )
}

export function PerformancePeriodToggle({
  value,
  onChange,
}: {
  value: 7 | 14 | 30
  onChange: (v: 7 | 14 | 30) => void
}) {
  return (
    <div className="flex gap-0.5 rounded-md border border-line bg-surface-1 p-0.5">
      {([7, 14, 30] as const).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={cn(
            'interactive rounded-[5px] px-2.5 py-1 text-2xs font-medium tabular',
            value === d ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg-secondary',
          )}
        >
          {d}D
        </button>
      ))}
    </div>
  )
}
