import type { MessagePreviewContext } from '@/types/messaging'

/**
 * Client-side placeholder resolution — mirrors backend BLAPI/MessageTemplates/render.py
 * so previews match what recipients see at send time.
 */
export function renderMessageTemplate(text: string, ctx: MessagePreviewContext): string {
  if (!text) return ''
  return text
    .replaceAll('{first_name}', ctx.first_name)
    .replaceAll('{lead_name}', ctx.lead_name)
    .replaceAll('{company}', ctx.company)
    .replaceAll('{offer_name}', ctx.offer_name)
    .replaceAll('{agent_name}', ctx.agent_name)
    .replaceAll('{booking_link}', ctx.booking_link)
    .replaceAll('{contact_name}', ctx.first_name)
    .replaceAll('{name}', ctx.lead_name)
}
