import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'

function fmt(n: number | undefined): string {
  return (Number(n) || 0).toLocaleString()
}

function fmtPct(n: number | undefined): string {
  return `${Math.round((Number(n) || 0) * 100)}%`
}

export default function ClientAnalytics() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getWorkspaceAnalytics())

  const cards = data
    ? [
        { label: 'Offers', value: fmt(data.offers) },
        { label: 'Leads', value: fmt(data.leads) },
        { label: 'Verified leads', value: fmt(data.verified) },
        { label: 'Meetings booked', value: fmt(data.meetingsBooked) },
        { label: 'Calls', value: fmt(data.calls) },
        { label: 'AI cost events', value: fmt(data.costEvents) },
        { label: 'Total spend', value: `$${(Number(data.spendUsd) || 0).toFixed(2)}` },
        { label: 'Conversion rate', value: fmtPct(data.conversionRate) },
      ]
    : []

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Workspace-wide performance across every campaign."
        />

        {loading ? (
          <LoadingState rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="surface p-4">
                <div className="text-2xs font-medium uppercase tracking-wider text-fg-muted">{c.label}</div>
                <div className="mt-2 text-lg font-semibold text-fg">{c.value}</div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </PageTransition>
  )
}
