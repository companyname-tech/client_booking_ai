import { useCallback, useRef } from 'react'
import { FieldGroup, FieldLabel } from './Field'

export interface RangeSliderProps {
  label: string
  min: number
  max: number
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  className?: string
}

export function RangeSlider({ label, min, max, valueMin, valueMax, onChange, className }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const handleMin = useCallback(
    (v: number) => {
      const next = Math.min(v, valueMax - 1)
      onChange(Math.max(min, next), valueMax)
    },
    [min, valueMax, onChange],
  )

  const handleMax = useCallback(
    (v: number) => {
      const next = Math.max(v, valueMin + 1)
      onChange(valueMin, Math.min(max, next))
    },
    [max, valueMin, onChange],
  )

  return (
    <FieldGroup className={className}>
      <div className="flex items-end justify-between">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-sm font-semibold tabular text-fg">
          {valueMin} — {valueMax}
        </span>
      </div>
      <div ref={trackRef} className="relative mt-3 h-1.5 rounded-full bg-white/[0.08]">
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-accent to-violet"
          style={{ left: `${pct(valueMin)}%`, right: `${100 - pct(valueMax)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => handleMin(Number(e.target.value))}
          aria-label={`Minimum ${label}`}
          className="range-thumb absolute inset-0 w-full cursor-pointer appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => handleMax(Number(e.target.value))}
          aria-label={`Maximum ${label}`}
          className="range-thumb absolute inset-0 w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>
      <div className="mt-1 flex justify-between text-2xs text-fg-muted tabular">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <style>{`
        .range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-fg);
          border: 2px solid var(--color-accent);
          box-shadow: 0 0 0 3px rgb(124 156 255 / 0.2);
          cursor: grab;
        }
        .range-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-fg);
          border: 2px solid var(--color-accent);
          cursor: grab;
        }
      `}</style>
    </FieldGroup>
  )
}
