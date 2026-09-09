import { useCallback, useState, type ReactNode } from 'react'
import { Check, Copy, Hash, User } from 'lucide-react'
import { copyToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/utils'
import { Dropdown } from '@/components/ui/Dropdown'
import { useMediaQuery } from '@/hooks/useMediaQuery'

type CopyKind = 'name' | 'id'

export interface CopyableNameProps {
  name: string
  id: string
  className?: string
  children?: ReactNode
  /** Table/list layout: icon appears inline after the name on hover. */
  compact?: boolean
  /** Reveal the copy icon when a parent with Tailwind `group` is hovered (e.g. table rows). */
  rowHover?: boolean
  /** Called after a successful copy (e.g. to show a page-level message). */
  onCopied?: (label: string) => void
}

export function CopyableName({
  name,
  id,
  className = '',
  children,
  compact = false,
  rowHover = false,
  onCopied,
}: CopyableNameProps) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState<CopyKind | null>(null)
  const canHover = useMediaQuery('(hover: hover)')

  const handleCopy = useCallback(
    async (kind: CopyKind) => {
      const text = kind === 'name' ? name : id
      const label = kind === 'name' ? 'Name' : 'ID'
      try {
        await copyToClipboard(text)
        setCopied(kind)
        onCopied?.(`${label} copied`)
        window.setTimeout(() => setCopied(null), 1500)
      } catch {
        onCopied?.(`Failed to copy ${label.toLowerCase()}`)
      }
    },
    [id, name, onCopied],
  )

  const showCopy = !canHover || hovered || (rowHover && !canHover)

  return (
    <div
      className={cn(
        'group/copy inline-flex min-w-0 items-center gap-1.5',
        compact && 'w-full max-w-full',
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={cn('min-w-0 truncate', compact && 'hover:underline')}>
        {children ?? name}
      </span>
      <Dropdown
        align="start"
        side="bottom"
        width={148}
        sections={[
          {
            items: [
              {
                id: 'copy-name',
                label: 'Copy name',
                icon: copied === 'name' ? <Check className="text-success" /> : <User />,
                onSelect: () => void handleCopy('name'),
              },
              {
                id: 'copy-id',
                label: 'Copy ID',
                icon: copied === 'id' ? <Check className="text-success" /> : <Hash />,
                onSelect: () => void handleCopy('id'),
              },
            ],
          },
        ]}
        trigger={({ toggle, 'aria-expanded': expanded, ...props }) => (
          <span
            {...props}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            aria-label="Copy name or ID"
            title="Copy name or ID"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              toggle()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                e.preventDefault()
                toggle()
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              'inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-full border transition-colors duration-150',
              compact ? 'size-6' : 'size-5',
              expanded ? 'border-accent/50 bg-accent/10 text-accent' : 'border-line bg-surface-2 text-fg-muted',
              rowHover && canHover
                ? 'pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'
                : showCopy
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0',
            )}
          >
            <Copy className={compact ? 'size-3.5' : 'size-3'} />
          </span>
        )}
      />
    </div>
  )
}
