import { Sparkles } from 'lucide-react'
import type { CampaignInsight } from '@/types'

export function CampaignInsights({ insights }: { insights: CampaignInsight[] }) {
  if (insights.length === 0) return null

  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-violet" />
        <h3 className="text-sm font-semibold text-fg">AI insights</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {insights.map((ins) => (
          <li key={ins.id} className="border-l-2 border-violet/40 pl-3 text-sm leading-relaxed text-fg-secondary">
            {ins.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
