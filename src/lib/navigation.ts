import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bot,
  Building2,
  CheckCircle2,
  GraduationCap,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Phone,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'

export type Zone = 'client' | 'admin'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  badge?: string | number
  badgeTone?: 'neutral' | 'accent' | 'warning'
  end?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const clientNavigation: NavSection[] = [
  {
    label: 'Command Center',
    items: [
      { label: 'Overview', to: '/client/overview', icon: LayoutGrid },
      { label: 'Campaigns', to: '/client/campaigns', icon: Megaphone, badge: 3, badgeTone: 'accent' },
    ],
  },
  {
    label: 'AI',
    items: [
      { label: 'AI Command Center', to: '/client/ai', icon: Bot, badge: 'Live', badgeTone: 'accent' },
      { label: 'Conversations', to: '/client/ai/conversations', icon: MessageSquare },
      { label: 'Calls', to: '/client/ai/calls', icon: Phone },
      { label: 'Learning', to: '/client/ai/learning', icon: GraduationCap },
      { label: 'Performance', to: '/client/ai/performance', icon: Activity },
    ],
  },
  {
    label: 'Leads',
    items: [
      { label: 'Lead Intelligence', to: '/client/leads', icon: Users },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Analytics', to: '/client/analytics', icon: Activity },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Recordings', to: '/client/recordings', icon: Activity },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Settings', to: '/client/settings', icon: Settings },
    ],
  },
]

export const adminNavigation: NavSection[] = [
  {
    label: 'Control',
    items: [
      { label: 'Overview', to: '/admin/overview', icon: LayoutGrid },
      { label: 'Clients', to: '/admin/clients', icon: Building2 },
      { label: 'Campaigns', to: '/admin/campaigns', icon: Megaphone, badge: 8, badgeTone: 'warning' },
      { label: 'AI Training', to: '/admin/ai-training', icon: GraduationCap },
      { label: 'Approvals', to: '/admin/approvals', icon: CheckCircle2, badge: 3, badgeTone: 'warning' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Leads', to: '/admin/leads', icon: Users },
      { label: 'Calls', to: '/admin/calls', icon: Phone },
      { label: 'Compliance', to: '/admin/compliance', icon: ShieldCheck },
      { label: 'Activity', to: '/admin/activity', icon: Activity },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ],
  },
]

export function navigationFor(zone: Zone) {
  return zone === 'admin' ? adminNavigation : clientNavigation
}
