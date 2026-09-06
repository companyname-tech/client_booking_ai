import { useId, useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { Tone } from '@/types'
import { cn } from '@/lib/utils'

export interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  tone?: Tone
  /** Fill the area under the line with a faint gradient. */
  area?: boolean
  /** Animate the line drawing in on mount. */
  animate?: boolean
  strokeWidth?: number
  className?: string
}

const toneStroke: Record<Tone, string> = {
  neutral: 'stroke-fg-muted',
  info: 'stroke-accent',
  success: 'stroke-success',
  warning: 'stroke-warning',
  danger: 'stroke-danger',
  violet: 'stroke-violet',
}

const toneFill: Record<Tone, string> = {
  neutral: '#667087',
  info: '#7c9cff',
  success: '#3ddc97',
  warning: '#f5b544',
  danger: '#ff6b6b',
  violet: '#9b8cf9',
}

/** Catmull-Rom → cubic Bézier for a smooth but faithful curve. */
function smoothPath(points: [number, number][]) {
  if (points.length < 2) return ''
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}

/**
 * Tiny inline SVG chart. Pure SVG, no chart library — cheap to render in
 * lists. Scales with `preserveAspectRatio="none"` so it can be fluid width.
 */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  tone = 'info',
  area = true,
  animate = true,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  const id = useId()
  const reduce = useReducedMotion()

  const { line, fill, last } = useMemo(() => {
    if (data.length === 0) return { line: '', fill: '', last: null }
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const pad = strokeWidth + 1
    const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0
    const pts = data.map<[number, number]>((v, i) => [
      pad + i * stepX,
      pad + (1 - (v - min) / range) * (height - pad * 2),
    ])
    const line = smoothPath(pts)
    const first = pts[0]
    const end = pts[pts.length - 1]
    const fill = `${line} L ${end[0]} ${height} L ${first[0]} ${height} Z`
    return { line, fill, last: end }
  }, [data, width, height, strokeWidth])

  if (!line) return null

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('block overflow-visible', className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={toneFill[tone]} stopOpacity="0.22" />
          <stop offset="100%" stopColor={toneFill[tone]} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && (
        <motion.path
          d={fill}
          fill={`url(#${id}-g)`}
          initial={animate && !reduce ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
      )}
      <motion.path
        d={line}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={toneStroke[tone]}
        initial={animate && !reduce ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      {last && (
        <motion.circle
          cx={last[0]}
          cy={last[1]}
          r={strokeWidth + 0.5}
          fill={toneFill[tone]}
          initial={animate && !reduce ? { scale: 0, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.55, type: 'spring', stiffness: 500, damping: 30 }}
          style={{ transformOrigin: `${last[0]}px ${last[1]}px` }}
        />
      )}
    </svg>
  )
}
