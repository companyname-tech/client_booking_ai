import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CostCards } from '@/components/admin/costs/CostCards'
import { CostBreakdown } from '@/components/admin/costs/CostBreakdown'
import { CostEventsTable } from '@/components/admin/costs/CostEventsTable'
import { CostPricingTable } from '@/components/admin/costs/CostPricingTable'

export default function AdminCosts() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [summary, events, pricing, balance] = await Promise.all([
      repo.getCostSummary(),
      repo.getCostEvents({ limit: 100 }),
      repo.getCostPricing(),
      repo.getCostBalance(),
    ])
    return { summary, events, pricing, balance }
  })

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Costs" />}
          title="AI Costs"
          description="Usage spend, token volume, and model pricing."
        />

        {loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <CostCards balance={data?.balance ?? null} summary={data?.summary ?? null} />
            <CostBreakdown summary={data?.summary ?? null} />
            <CostEventsTable events={data?.events ?? []} />
            <CostPricingTable pricing={data?.pricing ?? null} />
          </>
        )}
      </PageContainer>
    </PageTransition>
  )
}
