import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldError, FieldGroup, FieldLabel } from './Field'

export interface ChipInputProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  suggestions?: string[]
  placeholder?: string
  error?: string
  hint?: string
}

export function ChipInput({ label, value, onChange, suggestions = [], placeholder, error, hint }: ChipInputProps) {
  const [input, setInput] = useState('')

  const add = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(input)
    } else if (e.key === 'Backspace' && !input && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <FieldGroup>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div
        className={cn(
          'flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/25',
          error && 'border-danger/50',
        )}
      >
        {value.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-sm bg-violet-soft px-2 py-0.5 text-xs font-medium text-violet"
          >
            {chip}
            <button type="button" aria-label={`Remove ${chip}`} onClick={() => onChange(value.filter((v) => v !== chip))}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input && add(input)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-fg outline-none placeholder:text-fg-faint"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="interactive rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-fg-muted hover:border-line-strong hover:text-fg-secondary"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
      <FieldError>{error}</FieldError>
    </FieldGroup>
  )
}
