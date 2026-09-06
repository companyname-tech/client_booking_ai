import { Check, Circle } from 'lucide-react'
import { motion } from 'motion/react'
import type { CampaignDraft } from '@/types/campaignDraft'
import { computeReadiness } from '@/lib/onboardingValidation'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils'

export function CampaignReadiness({ draft }: { draft: CampaignDraft }) {
  const { score, items } = computeReadiness(draft)
  const ready = score >= 85

  return (
    <div className="surface-raised p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="label-caps">Campaign readiness</div>
          <div className="mt-1 flex items-baseline gap-2">
            <AnimatedNumber value={score} format={(n) => `${Math.round(n)}%`} className="text-3xl font-semibold tracking-tight text-fg" />
            <span className={cn('text-sm font-medium', ready ? 'text-success' : 'text-warning')}>
              {ready ? 'Ready to submit' : 'Almost there'}
            </span>
          </div>
        </div>
        <ProgressBar value={score} tone={ready ? 'success' : 'violet'} segments={20} size="sm" className="w-full max-w-xs sm:mt-0" label="Campaign readiness" />
      </div>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            className="flex items-center gap-2 text-sm"
          >
            {item.done ? (
              <Check className="size-4 shrink-0 text-success" strokeWidth={2.5} />
            ) : item.optional ? (
              <Circle className="size-4 shrink-0 text-warning" strokeWidth={1.75} />
            ) : (
              <Circle className="size-4 shrink-0 text-fg-faint" strokeWidth={1.75} />
            )}
            <span className={cn(item.done ? 'text-fg-secondary' : 'text-fg-muted')}>
              {item.optional && !item.done && '! '}
              {item.label}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
