import { useOutletContext } from 'react-router-dom'
import type { Campaign, CampaignStatus } from '@/types'

export interface CampaignOutletContext {
  campaign: Campaign
  zone: 'client' | 'admin'
  effectiveStatus: CampaignStatus
  pauseCampaign: () => void
  resumeCampaign: () => void
}

export function useCampaignContext() {
  return useOutletContext<CampaignOutletContext>()
}
