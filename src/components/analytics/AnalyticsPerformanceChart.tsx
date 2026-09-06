import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { AnalyticsTimePoint } from '@/types/campaignAnalytics'
import { cn } from '@/lib/utils'
import { AnalyticsSection } from './AnalyticsShared'

type Series = 'leads' | 'conversations' | 'detailsRequested' | 'bookings'

const SERIES: { key: Series; label: string; color: string }[] = [
  { key: 'leads', label: 'Leads', color: 'var(--color-accent)' },
  { key: 'conversations', label: 'Conversations', color: 'var(--color-violet)' },
  { key: 'detailsRequested', label: 'Details', color: 'var(--color-warning)' },
  { key: 'bookings', label: 'Bookings', color: 'var(--color-success)' },
]

export function AnalyticsPerformanceChart({ data }: { data: AnalyticsTimePoint[] }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState<Set<Series>>(new Set(['leads', 'conversations', 'bookings']))
  const [hover, setHover] = useState<number | null>(null)

  const { paths, width, height, padding } = useMemo(() => {
    const w = 640
    const h = 220
    const pad = { top: 16, right: 12, bottom: 32, left: 40 }
    const innerW = w - pad.left - pad.right
    const innerH = h - pad.top - pad.bottom
    const maxVal = Math.max(...data.flatMap((d) => [d.leads, d.conversations, d.detailsRequested, d.bookings]), 1)
    const toPath = (key: Series) =>
      data.map((d, i) => {
        const x = pad.left + (i / Math.max(data.length - 1, 1)) * innerW
        const y = pad.top + innerH - (d[key] / maxVal) * innerH
        return `${i === 0 ? 'M' : 'L'}${x},${y}`
      }).join(' ')
    return { width: w, height: h, padding: pad, paths: Object.fromEntries(SERIES.map((s) => [s.key, toPath(s.key)])) as Record<Series, string>, maxVal, innerW, innerH }
  }, [data])

  const toggle = (s: Series) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(s)) { if (next.size > 1) next.delete(s) } else next.add(s)
      return next
    })
  }

  const point = hover !== null ? data[hover] : null

  return (
    <AnalyticsSection title="Performance over time" description="Toggle metrics to compare trends">
      <div className="mb-3 flex flex-wrap gap-2">
        {SERIES.map((s) => (
          <button key={s.key} type="button" onClick={() => toggle(s.key)} className={cn('interactive rounded-full border px-2.5 py-0.5 text-2xs font-medium', active.has(s.key) ? 'border-line-strong bg-surface-3 text-fg' : 'border-line text-fg-faint')}>
            <span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>
      {point && (
        <div className="mb-3 rounded-md border border-line bg-surface-1 px-3 py-2 text-xs">
          <div className="font-medium text-fg">{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          <div className="mt-1 flex flex-wrap gap-3 text-fg-muted">
            <span>Leads {point.leads}</span>
            <span>Conversations {point.conversations}</span>
            <span>Bookings {point.bookings}</span>
            <span>Conv. {point.conversations > 0 ? ((point.bookings / point.conversations) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-full" role="img" aria-label="Performance chart" onMouseLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line key={pct} x1={padding.left} x2={width - padding.right} y1={padding.top + (height - padding.top - padding.bottom) * (1 - pct)} y2={padding.top + (height - padding.top - padding.bottom) * (1 - pct)} stroke="var(--color-line)" strokeWidth={1} />
        ))}
        {SERIES.map((s) => active.has(s.key) ? (
          <motion.path key={s.key} d={paths[s.key]} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" initial={reduce ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5 }} />
        ) : null)}
        {data.map((d, i) => (
          <g key={d.date}>
            <rect x={padding.left + (i / Math.max(data.length - 1, 1)) * (width - padding.left - padding.right) - 8} y={padding.top} width={16} height={height - padding.top - padding.bottom} fill="transparent" onMouseEnter={() => setHover(i)} />
            <text x={padding.left + (i / Math.max(data.length - 1, 1)) * (width - padding.left - padding.right)} y={height - 8} textAnchor="middle" className="fill-fg-faint text-[9px]">
              {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          </g>
        ))}
      </svg>
    </AnalyticsSection>
  )
}
