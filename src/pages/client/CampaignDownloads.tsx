import { Download } from 'lucide-react'
import { useCampaignContext } from './campaignContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignDownloads() {
  const { campaign } = useCampaignContext()

  return (
    <Reveal>
      <EmptyState
        icon={<Download className="size-6" />}
        title="Downloads"
        description={`Export leads, calls, and AI summaries for ${campaign.name}. Full export functionality is coming in a future release.`}
        action={<Button variant="secondary" disabled>Export CSV</Button>}
      />
    </Reveal>
  )
}
