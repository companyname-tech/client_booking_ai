import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, Bot, Phone } from 'lucide-react'
import type { Tone } from '@/types'
import type { ActivitySource } from '@/types/admin'

export interface ActivitySourceMeta {
  label: string
  tone: Tone
  icon: LucideIcon
}

/** Display metadata for each activity-log stream (audit trail / AI / calls). */
export const ACTIVITY_SOURCE_META: Record<ActivitySource, ActivitySourceMeta> = {
  audit: { label: 'Audit trail', tone: 'violet', icon: BadgeCheck },
  cost: { label: 'AI activity', tone: 'info', icon: Bot },
  call: { label: 'Calls', tone: 'success', icon: Phone },
}

export const ACTIVITY_SOURCES: ActivitySource[] = ['audit', 'cost', 'call']
