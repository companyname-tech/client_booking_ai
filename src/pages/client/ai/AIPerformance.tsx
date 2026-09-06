import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { AIPerformanceGrid } from '@/components/ai/AIOperations'
import { ObjectionIntelligence, AIResponsePerformance } from '@/components/ai/ObjectionIntelligence'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/motion/Reveal'

export default function AIPerformancePage() {
  const overview = repo.getAIOverview()
  const performance = repo.getAIPerformance()

  if (overview.availability === 'pre_launch') {
    return <EmptyState title="No performance data yet" description="AI performance metrics will appear after launch." />
  }

  return (
    <div className="space-y-6">
      <section className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-fg">AI Performance</h2>
        <p className="mt-1 text-sm text-fg-muted">Simulated campaign metrics</p>
        <div className="mt-4"><AIPerformanceGrid metrics={performance.metrics} /></div>
      </section>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-fg">Performance by campaign</h2>
        <ul className="mt-4 space-y-2">
          {performance.byCampaign.map((c) => (
            <li key={c.campaignId}>
              <Link to={`/client/campaigns/${c.campaignId}/analytics`} className="interactive flex items-center justify-between rounded-lg border border-line px-4 py-3 hover:bg-surface-2">
                <span className="text-sm font-medium text-fg">{c.campaignName}</span>
                <span className="text-sm font-semibold tabular text-violet">{c.score}%</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Reveal><ObjectionIntelligence objections={repo.getAIObjections()} /></Reveal>
      <Reveal><AIResponsePerformance objections={repo.getAIObjections()} /></Reveal>
    </div>
  )
}
