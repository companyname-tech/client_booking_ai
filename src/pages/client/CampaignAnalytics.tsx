import { useMemo, useState } from 'react'
import { useCampaignContext } from './campaignContext'
import { repo } from '@/data/repository'
import type { AnalyticsFilters } from '@/types/campaignAnalytics'
import { Reveal } from '@/components/motion/Reveal'
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader'
import { AnalyticsSummary, PerformanceComparison } from '@/components/analytics/AnalyticsSummary'
import { AnalyticsPerformanceChart } from '@/components/analytics/AnalyticsPerformanceChart'
import { AnalyticsFunnel, DropOffAnalysis } from '@/components/analytics/AnalyticsFunnel'
import { AIIntelligence, AIRecommendations, AIExecutiveSummary } from '@/components/analytics/AnalyticsAI'
import { TargetingAnalysis, IndustryPerformance, CompanySizePerformance, JobTitlePerformance, GeographicPerformance, AgePerformance } from '@/components/analytics/AnalyticsTargeting'
import { CallPerformancePanel, CallOutcomeDistribution, ConversationQualityPanel } from '@/components/analytics/AnalyticsCalls'
import { AIPerformancePanel, AILearningTimeline, AIExperiments, CampaignBenchmark } from '@/components/analytics/AnalyticsAIPerformance'
import { BudgetIntelligence, CampaignForecastPanel, PerformanceHeatmap } from '@/components/analytics/AnalyticsBudget'
import { AnalyticsFiltersPanel, countActiveFilters } from '@/components/analytics/AnalyticsFilters'
import { AnalyticsExport } from '@/components/analytics/AnalyticsExport'
import { AnalyticsPreLaunch, AnalyticsStatusBanner } from '@/components/analytics/AnalyticsPreLaunch'

const DEFAULT_FILTERS: AnalyticsFilters = { dateRange: 30 }

export default function CampaignAnalytics() {
  const { campaign, effectiveStatus } = useCampaignContext()
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const analytics = useMemo(() => {
    const data = repo.getCampaignAnalytics(campaign.id, { ...filters, dateRange: filters.dateRange })
    if (effectiveStatus === 'paused' && data.availability === 'live') {
      return { ...data, availability: 'paused' as const, statusLabel: 'Paused' }
    }
    if (effectiveStatus === 'completed') {
      return { ...data, availability: 'completed' as const, statusLabel: 'Completed' }
    }
    return data
  }, [campaign.id, filters, effectiveStatus])

  const filterCount = countActiveFilters(filters)
  const isPreLaunch = analytics.availability === 'pre_launch'

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <AnalyticsHeader
            campaign={{ ...campaign, status: effectiveStatus }}
            dateRange={filters.dateRange}
            onDateRangeChange={(dateRange) => setFilters((f) => ({ ...f, dateRange }))}
            onOpenFilters={() => setFiltersOpen(true)}
            filterCount={filterCount}
          />
          {!isPreLaunch && <AnalyticsExport />}
        </div>
      </Reveal>

      {analytics.availability === 'paused' && (
        <AnalyticsStatusBanner variant="paused" message="Campaign paused — analytics remain available for review." />
      )}
      {analytics.availability === 'completed' && (
        <AnalyticsStatusBanner variant="completed" message="Campaign completed — final performance summary below." />
      )}

      {isPreLaunch ? (
        <AnalyticsPreLaunch statusLabel={analytics.statusLabel} />
      ) : (
        <>
          <AnalyticsSummary overview={analytics.overview} />
          <AnalyticsPerformanceChart data={analytics.timeseries[filters.dateRange]} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PerformanceComparison rows={analytics.comparison} />
            <AnalyticsFunnel stages={analytics.funnel} />
          </div>
          <DropOffAnalysis dropOffs={analytics.dropOffs} />
          <AIIntelligence insights={analytics.insights} conversationsAnalyzed={analytics.conversationsAnalyzed} />
          <AIRecommendations items={analytics.recommendations} />
          <TargetingAnalysis targeting={analytics.targeting} />
          <div className="grid gap-6 lg:grid-cols-2">
            <IndustryPerformance rows={analytics.targeting.industries} />
            <CompanySizePerformance rows={analytics.targeting.companySizes} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <JobTitlePerformance rows={analytics.targeting.jobTitles} />
            <AgePerformance rows={analytics.targeting.ageGroups} />
          </div>
          <GeographicPerformance rows={analytics.targeting.locations} />
          <CallPerformancePanel data={analytics.callPerformance} />
          <div className="grid gap-6 lg:grid-cols-2">
            <CallOutcomeDistribution outcomes={analytics.callOutcomes} />
            <ConversationQualityPanel quality={analytics.conversationQuality} />
          </div>
          <AIPerformancePanel metrics={analytics.aiPerformance} />
          <div className="grid gap-6 lg:grid-cols-2">
            <AILearningTimeline events={analytics.aiLearning} />
            <AIExperiments experiments={analytics.experiments} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <BudgetIntelligence budget={analytics.budget} />
            <CampaignForecastPanel forecast={analytics.forecast} />
          </div>
          <CampaignBenchmark rows={analytics.benchmarks} />
          <PerformanceHeatmap cells={analytics.heatmap} recommendation={analytics.heatmapRecommendation} />
          <AIExecutiveSummary summary={analytics.executiveSummary} />
        </>
      )}

      <AnalyticsFiltersPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        options={analytics.filterOptions}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onClear={() => setFilters({ dateRange: filters.dateRange })}
      />
    </div>
  )
}
