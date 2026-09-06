import { BarChart3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/motion/Reveal'

export function AnalyticsPreLaunch({ statusLabel }: { statusLabel: string }) {
  return (
    <Reveal>
      <div className="surface p-8 sm:p-12">
        <EmptyState
          icon={<BarChart3 className="size-8 text-fg-muted" />}
          title="Campaign preparation"
          description="Detailed analytics will become available once your campaign launches. You can review projected estimates below once the campaign is approved."
        />
        <p className="mt-4 text-center text-sm text-fg-muted">Current status: {statusLabel}</p>
      </div>
    </Reveal>
  )
}

export function AnalyticsStatusBanner({ variant, message }: { variant: 'paused' | 'completed'; message: string }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${variant === 'paused' ? 'border-warning/20 bg-warning-soft/10 text-warning' : 'border-info/20 bg-info-soft/10 text-info'}`}>
      {message}
    </div>
  )
}
