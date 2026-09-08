import { useOutletContext } from 'react-router-dom'
import type { OfferCampaign, CampaignStatus } from '@/types'

export interface CampaignOutletContext {
  campaign: OfferCampaign
  zone: 'client' | 'admin'
  effectiveStatus: CampaignStatus
  pauseCampaign: () => void
  resumeCampaign: () => void
  refreshCampaign: () => Promise<void>
  updateCampaignBudget: (budget: OfferCampaign['budget']) => void
}

export function useCampaignContext() {
  return useOutletContext<CampaignOutletContext>()
}
