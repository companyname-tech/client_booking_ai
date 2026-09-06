import { repo } from '@/data/repository'
import { useCampaignContext } from './campaignContext'
import { RecordingList } from '@/components/recordings/RecordingList'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignRecordings() {
  const { campaign } = useCampaignContext()
  const recordings = repo.getRecordings(campaign.id)

  return (
    <Reveal className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-fg">Recordings</h2>
        <p className="mt-1 text-sm text-fg-muted">Review conversations and AI-generated summaries.</p>
      </div>
      <RecordingList recordings={recordings} />
    </Reveal>
  )
}
