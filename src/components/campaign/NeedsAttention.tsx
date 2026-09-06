import { Link } from 'react-router-dom'
import { AlertCircle, Info } from 'lucide-react'
import type { CampaignAttentionAlert } from '@/types'
import { cn } from '@/lib/utils'

export function NeedsAttention({ alerts, basePath }: { alerts: CampaignAttentionAlert[]; basePath: string }) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-fg">Needs attention</h3>
      <ul className="space-y-2">
        {alerts.map((a) => (
          <li
            key={a.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3',
              a.tone === 'warning' ? 'border-warning/20 bg-warning-soft/10' : 'border-line bg-surface-1',
            )}
          >
            {a.tone === 'warning' ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0 text-accent" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{a.title}</p>
              <p className="mt-0.5 text-xs text-fg-muted">{a.description}</p>
              {a.href && (
                <Link to={`${basePath}/${a.href}`} className="interactive mt-2 inline-block text-xs font-medium text-accent hover:text-fg">
                  {a.actionLabel ?? 'View'} →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
