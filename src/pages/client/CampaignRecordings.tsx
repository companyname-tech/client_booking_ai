import { repo } from '@/data/repository'
import { useCampaignContext } from './campaignContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { RecordingList } from '@/components/recordings/RecordingList'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignRecordings() {
  const { campaign } = useCampaignContext()
  const { data: recordings, loading, error, reload } = useAsyncData(() => repo.getRecordings(campaign.id), [campaign.id])

  if (loading) return <LoadingState rows={5} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <Reveal className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-fg">Recordings</h2>
        <p className="mt-1 text-sm text-fg-muted">Review conversations and AI-generated summaries.</p>
      </div>
      <RecordingList recordings={recordings ?? []} />
    </Reveal>
  )
}
