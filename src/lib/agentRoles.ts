import type { AgentRole } from '@/types/settings'

/**
 * Agent role metadata — domain constants shared by the settings UI and the
 * agent editors. Kept out of the adapters so UI code never imports from one.
 */

export const AGENT_ROLE_ORDER: AgentRole[] = [
  'cold_call_seller',
  'appointment_setter',
  'sales_follow_up',
  'customer_support',
  'custom',
]

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  cold_call_seller: 'Cold Call Seller',
  appointment_setter: 'Appointment Setter',
  sales_follow_up: 'Sales Follow-up',
  customer_support: 'Customer Support',
  custom: 'Custom',
}

/** Default identity used when an agent has no custom `identity` string. */
export const AGENT_ROLE_TEMPLATES: Record<AgentRole, string> = {
  cold_call_seller:
    'You are a direct, confident cold-call sales agent. Introduce yourself, state the reason for calling, and move the conversation toward booking a meeting.',
  appointment_setter:
    'You are a polite appointment setter. Find a mutually convenient time, handle scheduling objections smoothly, and book the meeting.',
  sales_follow_up:
    'You are a warm sales follow-up agent. Reconnect with previously contacted leads, restate the value, and advance them toward a booking.',
  customer_support:
    'You are a helpful customer support agent. Answer questions, resolve concerns, and leave callers satisfied.',
  custom: 'You are a custom AI agent configured for this client.',
}

/** Resolved identity: custom identity wins, otherwise the role template. */
export function resolveAgentIdentity(role: AgentRole, identity: string): string {
  const custom = identity.trim()
  return custom || AGENT_ROLE_TEMPLATES[role]
}
