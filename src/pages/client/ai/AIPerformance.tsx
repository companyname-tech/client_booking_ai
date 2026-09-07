import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { AIPerformanceGrid } from '@/components/ai/AIOperations'
import { ObjectionIntelligence, AIResponsePerformance } from '@/components/ai/ObjectionIntelligence'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Reveal } from '@/components/motion/Reveal'

export default function AIPerformancePage() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [overview, performance, objections] = await Promise.all([
      repo.getAIOverview(),
      repo.getAIPerformance(),
      repo.getAIObjections(),
    ])
    return { overview, performance, objections }
  }, [])

  if (loading) return <LoadingState rows={6} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null

  const { overview, performance, objections } = data

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
            <li key={c.offerCampaignId}>
              <Link to={`/client/campaigns/${c.offerCampaignId}/analytics`} className="interactive flex items-center justify-between rounded-lg border border-line px-4 py-3 hover:bg-surface-2">
                <span className="text-sm font-medium text-fg">{c.campaignName}</span>
                <span className="text-sm font-semibold tabular text-violet">{c.score}%</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Reveal><ObjectionIntelligence objections={objections} /></Reveal>
      <Reveal><AIResponsePerformance objections={objections} /></Reveal>
    </div>
  )
}
