import { repo } from '@/api/repository'
import { useCampaignContext } from './campaignContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CallHistoryList } from '@/components/recordings/CallHistoryList'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignRecordings() {
  const { campaign } = useCampaignContext()
  const { data: calls, loading, error, reload } = useAsyncData(
    () => repo.getCallHistory(campaign.id),
    [campaign.id],
  )

  if (loading) return <LoadingState rows={5} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <Reveal className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-fg">Calls &amp; Recordings</h2>
        <p className="mt-1 text-sm text-fg-muted">Every recorded call with replayable audio — newest first.</p>
      </div>
      <CallHistoryList recordings={calls ?? []} />
    </Reveal>
  )
}
