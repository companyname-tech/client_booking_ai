import { useState } from 'react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { CallFilters, useCallFilters } from '@/components/calls/CallFilters'
import { CallsTable } from '@/components/calls/CallsTable'
import { CallDrawer } from '@/components/calls/CallDrawer'
import { RecordingIntelligence } from '@/components/ai/ConversationWorkspace'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatNumber } from '@/lib/utils'
import type { Call } from '@/types'

export default function AICalls() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [overview, campaigns] = await Promise.all([repo.getAIOverview(), repo.getCampaigns()])
    const callsByCampaign = await Promise.all(campaigns.map((c) => repo.getCalls(c.id)))
    const leadsByCampaign = await Promise.all(campaigns.map((c) => repo.getLeads(c.id)))
    return {
      overview,
      campaigns,
      allCalls: callsByCampaign.flat(),
      allLeads: leadsByCampaign.flat(),
    }
  }, [])

  const [selected, setSelected] = useState<Call | null>(null)
  const { filters, setFilters, filtered, summary } = useCallFilters(data?.allCalls ?? [])

  const { data: drawer } = useAsyncData(
    async () => {
      if (!selected || !data) return null
      const campaign = data.campaigns.find((c) => c.id === selected.offerCampaignId)
      const detail = campaign ? await repo.getCall(campaign.id, selected.id) : null
      const conversations = await repo.getAIConversations()
      const conversation = conversations.find((c) => c.callId === selected.id)
      const convDetail = conversation ? await repo.getAIConversation(conversation.id) : undefined
      return { detail, convDetail }
    },
    [selected?.id, data],
  )

  if (loading) return <LoadingState rows={6} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null

  const { overview, allLeads } = data

  if (overview.availability === 'pre_launch') {
    return <EmptyState title="No calls yet" description="Call data will appear once your campaign launches." />
  }

  const lead = selected ? allLeads.find((l) => l.id === selected.leadId) : undefined
  const detail = drawer?.detail ?? null
  const convDetail = drawer?.convDetail

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-5">
        {[
          { label: 'Calls today', value: 2842 },
          { label: 'Connected', value: 1284 },
          { label: 'Conversations', value: 1428 },
          { label: 'Bookings', value: 184 },
          { label: 'Avg duration', value: '3m 42s', raw: true },
        ].map((m) => (
          <div key={m.label} className="bg-surface-2 p-4">
            <div className="text-2xs text-fg-muted">{m.label}</div>
            <div className="mt-1 text-lg font-semibold tabular text-fg">{m.raw ? m.value : formatNumber(m.value as number)}</div>
          </div>
        ))}
      </div>
      <CallFilters value={filters} onChange={setFilters} summary={summary} />
      <CallsTable calls={filtered} leads={allLeads} onSelect={setSelected} />
      <CallDrawer call={detail ?? null} lead={lead} open={!!selected} onClose={() => setSelected(null)} />
      {convDetail && (
        <DetailDrawer open={!!selected && !!convDetail} onClose={() => setSelected(null)} title="Recording intelligence" subtitle={lead?.name}>
          <div className="p-5"><RecordingIntelligence conversation={convDetail} /></div>
        </DetailDrawer>
      )}
    </div>
  )
}
