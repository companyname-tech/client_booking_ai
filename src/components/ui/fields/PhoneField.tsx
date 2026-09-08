import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { countryCodes, type CountryCode } from '@/data/countryCodes'
import { cn } from '@/lib/utils'
import { useDismiss } from '@/hooks/useDismiss'

export interface PhoneFieldProps {
  id?: string
  value: string
  onChange: (next: string) => void
  onValidityChange?: (valid: boolean) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  /** Force the error state even before blur (used by submit attempts). */
  forceError?: boolean
}

/** Strip everything that is not a digit or a leading +. */

/** True when the national digits look plausible for the country. */
function plausibleFor(_country: CountryCode, national: string): boolean {
  const digits = national.replace(/\D/g, '')
  // IL mobile = 9-10 digits, US = 10, most others 6-12 — a loose sanity range.
  return digits.length >= 7 && digits.length <= 13
}

function matchesQuery(country: CountryCode, q: string): boolean {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const dial = country.dialCode.replace('+', '')
  return (
    country.name.toLowerCase().includes(query) ||
    country.code.toLowerCase().includes(query) ||
    dial.includes(query.replace(/^\+/, ''))
  )
}

/**
 * Phone input with a searchable country-code dropdown (flag + dial code).
 * Ported from the MoneyMakers shared-repo credential PhoneField interaction,
 * restyled to this app's tokens. The value contract stays a plain string —
 * the caller receives the full dialed number, e.g. "+972545551234".
 */
export function PhoneField({
  id,
  value,
  onChange,
  onValidityChange,
  placeholder = 'Phone number',
  required = false,
  disabled = false,
  className,
  forceError = false,
}: PhoneFieldProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [touched, setTouched] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse the current full value into a dial code + local digits.
  const parsed = useMemo(() => {
    const v = (value || '').trim()
    if (/^\+\d{1,3}/.test(v)) {
      // Longest matching dial code prefix (IL +972 before US +1, etc.)
      let best: CountryCode = countryCodes[0]
      for (const c of countryCodes) {
        if (v.startsWith(c.dialCode) && c.dialCode.length > best.dialCode.length) best = c
      }
      if (v.startsWith(best.dialCode)) {
        return { country: best, local: v.slice(best.dialCode.length).replace(/[^\d\s-]/g, '') }
      }
    }
    if (/^0\d{8,9}/.test(v)) {
      const il = countryCodes.find((c) => c.code === 'IL') ?? countryCodes[0]
      return { country: il, local: v }
    }
    const il = countryCodes.find((c) => c.code === 'IL') ?? countryCodes[0]
    return { country: il, local: v.replace(/[^\d\s-]/g, '') }
  }, [value])

  const hasValue = (parsed.local.replace(/\D/g, '') || value.replace(/\D/g, '')).length > 0
  const valid = !hasValue ? !required : plausibleFor(parsed.country, parsed.local)
  const showError = !disabled && (touched || forceError) && hasValue && !valid

  useEffect(() => {
    onValidityChange?.(!hasValue ? !required : valid)
  }, [hasValue, valid, required, onValidityChange])

  useDismiss(open, () => setOpen(false), [rootRef, listRef])

  const filtered = useMemo(() => countryCodes.filter((c) => matchesQuery(c, query)), [query])

  const selectCountry = (c: CountryCode) => {
    const local = parsed.local.replace(/^0/, '')
    onChange(`${c.dialCode}${local.replace(/\s/g, '')}`)
    setOpen(false)
    setQuery('')
    inputRef.current?.focus()
  }

  const handleLocal = (raw: string) => {
    let digits = raw.replace(/[^\d\s]/g, '')
    // Keep a single leading 0 for national-style numbers, else drop zeros.
    const noSpace = digits.replace(/\s/g, '')
    if (noSpace.length > 0 && noSpace[0] !== '0') {
      digits = noSpace.replace(/^0+/, '')
    }
    onChange(`${parsed.country.dialCode}${digits.replace(/\s/g, '')}`)
  }

  const list = open ? (
    <ul
      ref={listRef}
      role="listbox"
      aria-label="Countries"
      className="surface-overlay absolute left-0 top-full z-50 mt-1 max-h-64 w-full min-w-[240px] overflow-y-auto p-1"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {filtered.length === 0 ? (
        <li className="px-2 py-2 text-xs text-fg-muted">No country found.</li>
      ) : (
        filtered.map((c) => {
          const isSelected = c.code === parsed.country.code
          return (
            <li key={c.code}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectCountry(c)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-3',
                  isSelected && 'bg-surface-3',
                )}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs tabular text-fg-muted">{c.dialCode}</span>
                {isSelected ? <Check className="size-3.5 text-accent" /> : null}
              </button>
            </li>
          )
        })
      )}
    </ul>
  ) : null

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex w-full items-stretch rounded-md border border-line bg-surface-1 focus-within:ring-1 focus-within:ring-accent',
          showError && 'border-danger/60 focus-within:ring-danger',
          disabled && 'opacity-50',
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          title={`Country: ${parsed.country.name}`}
          className="flex items-center gap-1 rounded-l-md border-r border-line px-2 py-2 text-sm text-fg hover:bg-surface-2"
        >
          <span className="text-base leading-none">{parsed.country.flag}</span>
          <span className="tabular">{parsed.country.dialCode}</span>
          <ChevronDown className={cn('size-3.5 text-fg-muted transition-transform', open && 'rotate-180')} />
        </button>
        <input
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={parsed.local}
          onChange={(e) => handleLocal(e.target.value)}
          onFocus={() => setTouched(true)}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="w-full min-w-0 rounded-r-md bg-transparent px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none"
        />
      </div>
      {open ? createPortal(list, document.body) : null}
      {showError ? <p className="mt-1 text-xs text-danger">Enter a valid {parsed.country.name} phone number.</p> : null}
    </div>
  )
}
