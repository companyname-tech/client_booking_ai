import type { EmailTemplate, MessageTemplate } from '@/types/settings'

/** Campaign-scoped messaging templates stored on `campaign_content.messaging`. */
export interface CampaignMessagingContent {
  whatsapp_templates?: MessageTemplate[]
  email_templates?: EmailTemplate[]
}

export interface MessagePreviewContext {
  first_name: string
  lead_name: string
  company: string
  offer_name: string
  agent_name: string
  booking_link: string
}

export const DEFAULT_PREVIEW_CONTEXT: MessagePreviewContext = {
  first_name: 'Alex',
  lead_name: 'Acme Corp',
  company: 'Acme Corp',
  offer_name: 'Discovery outreach',
  agent_name: 'Sarah',
  booking_link: 'https://meet.google.com/abc-defg-hij',
}
