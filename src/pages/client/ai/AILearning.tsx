import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LearnedPatterns, AIImprovementTimeline } from '@/components/ai/ObjectionIntelligence'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Reveal } from '@/components/motion/Reveal'
import { formatNumber } from '@/lib/utils'

export default function AILearning() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [overview, patterns, improvements] = await Promise.all([
      repo.getAIOverview(),
      repo.getAILearningPatterns(),
      repo.getAIImprovements(),
    ])
    return { overview, patterns, improvements }
  }, [])

  if (loading) return <LoadingState rows={6} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null

  const { overview, patterns, improvements } = data

  if (overview.availability === 'pre_launch') {
    return <EmptyState title="AI learning in progress" description="Learning insights will appear once conversations begin." />
  }

  const stats = [
    { label: 'Conversations analyzed', value: overview.conversations },
    { label: 'Patterns identified', value: patterns.length },
    { label: 'Recent improvements', value: improvements.length },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
        {stats.map((s) => (
          <Reveal key={s.label} className="bg-surface-2 p-4">
            <div className="text-2xs text-fg-muted">{s.label}</div>
            <div className="mt-1 text-xl font-semibold tabular text-fg">{formatNumber(s.value)}</div>
          </Reveal>
        ))}
      </div>
      <section className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-fg">Learned patterns</h2>
        <p className="mt-1 text-sm text-fg-muted">What your booking agent has learned from campaign conversations</p>
        {patterns.length > 0 ? (
          <div className="mt-4"><LearnedPatterns patterns={patterns} /></div>
        ) : (
          <p className="mt-4 text-sm text-fg-muted">No patterns learned yet — insights appear once conversations are analyzed.</p>
        )}
      </section>
      <section className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-fg">AI Improvement History</h2>
        {improvements.length > 0 ? (
          <div className="mt-4"><AIImprovementTimeline items={improvements} /></div>
        ) : (
          <p className="mt-4 text-sm text-fg-muted">No improvements applied yet.</p>
        )}
      </section>
    </div>
  )
}
