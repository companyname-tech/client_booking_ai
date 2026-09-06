import type { ReactNode } from 'react'
import { Construction } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCampaignContext } from './campaignContext'

/**
 * Placeholder for a campaign sub-route (leads, calls, recordings…).
 */
export default function CampaignSection({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  const { campaign } = useCampaignContext()
  return (
    <Reveal initial="hidden" animate="show" className="surface">
      <EmptyState
        icon={icon ?? <Construction />}
        title={`${title} for ${campaign.name}`}
        description={description}
      />
    </Reveal>
  )
}
