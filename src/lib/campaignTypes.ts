export type CampaignType = 'live' | 'training'

export const CAMPAIGN_TYPE_OPTIONS: {
  value: CampaignType
  label: string
  description: string
}[] = [
  {
    value: 'live',
    label: 'Live',
    description: 'Production campaign — outbound calls run against a real budget.',
  },
  {
    value: 'training',
    label: 'Training',
    description: 'AI training sandbox — rehearse talks without a paid budget.',
  },
]

export function campaignTypeToSource(type: CampaignType): string {
  return type === 'training' ? 'training' : 'manual'
}

export function sourceToCampaignType(source?: string): CampaignType {
  return (source ?? '').toLowerCase() === 'training' ? 'training' : 'live'
}
