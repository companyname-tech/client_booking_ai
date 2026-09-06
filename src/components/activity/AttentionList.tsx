import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, ClipboardCheck, Eye, Plug, Upload, ListChecks } from 'lucide-react'
import type { AttentionItem, AttentionKind } from '@/types'
import { cn } from '@/lib/utils'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { Tooltip } from '@/components/ui/Tooltip'

const kindIcon: Record<AttentionKind, typeof Plug> = {
  integration: Plug,
  onboarding: ListChecks,
  approval: ClipboardCheck,
  upload: Upload,
  review: Eye,
}

const priorityMeta = {
  high: { dot: 'bg-danger', label: 'High priority' },
  medium: { dot: 'bg-warning', label: 'Medium priority' },
  low: { dot: 'bg-fg-muted', label: 'Low priority' },
}

/**
 * "Needs your attention" — compact grid of actionable tiles. Items can be
 * marked done locally; a real implementation would persist that.
 */
export function AttentionList({ items, className }: { items: AttentionItem[]; className?: string }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const visible = items.filter((i) => !dismissed.has(i.id))

  return (
    <Stagger as="section" className={cn('space-y-3', className)} aria-labelledby="attention-title">
      <Reveal className="flex items-end justify-between gap-4">
        <div>
          <h2 id="attention-title" className="text-md font-semibold text-fg">
            Needs your attention
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            <span className="tabular text-fg-secondary">{visible.length}</span> {visible.length === 1 ? 'action' : 'actions'} waiting on you
          </p>
        </div>
      </Reveal>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((item) => {
            const Icon = kindIcon[item.kind]
            const priority = priorityMeta[item.priority]
            return (
              <Reveal
                as="li"
                key={item.id}
                layout
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
                className="group surface relative transition-colors hover:border-line-strong hover:bg-surface-3/70"
              >
                <Link to={item.href} className="ring-focus flex h-full items-start gap-3 rounded-lg p-4 outline-none">
                  <span className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-3 text-fg-secondary ring-1 ring-white/[0.06]">
                    <Icon className="size-4" strokeWidth={1.75} />
                    <Tooltip content={priority.label} side="top">
                      <span
                        tabIndex={-1}
                        className={cn('absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-surface-2', priority.dot)}
                      />
                    </Tooltip>
                  </span>
                  <span className="min-w-0 flex-1 pr-6">
                    <span className="block text-sm font-medium text-fg">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-fg-muted">{item.description}</span>
                  </span>
                  <ArrowRight className="mt-1 size-3.5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg-secondary" />
                </Link>
                <Tooltip content="Mark as done" side="top">
                  <button
                    type="button"
                    aria-label={`Mark "${item.title}" as done`}
                    onClick={() => setDismissed((s) => new Set(s).add(item.id))}
                    className="interactive ring-focus absolute bottom-3 right-3 flex size-6 items-center justify-center rounded-sm text-fg-muted opacity-0 outline-none hover:bg-success-soft hover:text-success focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Check className="size-3.5" />
                  </button>
                </Tooltip>
              </Reveal>
            )
          })}
        </AnimatePresence>
        {visible.length === 0 && (
          <motion.li
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="surface flex items-center gap-3 p-4 text-sm text-fg-muted sm:col-span-2 xl:col-span-3"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-success-soft text-success">
              <Check className="size-4" />
            </span>
            You're all caught up. The AI will flag anything that needs a decision.
          </motion.li>
        )}
      </ul>
    </Stagger>
  )
}
