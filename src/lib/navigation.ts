import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bot,
  Building2,
  Calendar,
  DollarSign,
  Download,
  GraduationCap,
  KeyRound,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Phone,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { canUse } from '@/lib/permissions'

export type Zone = 'client' | 'admin'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  badge?: string | number
  badgeTone?: 'neutral' | 'accent' | 'warning'
  end?: boolean
  /**
   * Console permission required to see/enter this item (admin zone, role
   * "admin" sessions only). Undefined = any console view is enough;
   * 'users.manage' = super_admin only.
   */
  perm?: string
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
      { label: 'Campaigns', to: '/client/campaigns', icon: Megaphone },
    ],
  },
  {
    label: 'AI',
    items: [
      { label: 'AI Command Center', to: '/client/ai', icon: Bot, badge: 'Live', badgeTone: 'accent' },
      { label: 'Conversations', to: '/client/ai/conversations', icon: MessageSquare },
      { label: 'Learning', to: '/client/ai/learning', icon: GraduationCap },
      { label: 'Performance', to: '/client/ai/performance', icon: Activity },
    ],
  },
  {
    label: 'Analytics',
    items: [{ label: 'Analytics', to: '/client/analytics', icon: Activity }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Calls & Recordings', to: '/client/recordings', icon: Phone },
      { label: 'Calendar', to: '/client/calendar', icon: Calendar },
      { label: 'Bookings', to: '/client/bookings', icon: Calendar },
      { label: 'Downloads', to: '/client/downloads', icon: Download },
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
      { label: 'Clients', to: '/admin/clients', icon: Building2, perm: 'clients.view' },
      { label: 'Campaigns', to: '/admin/campaigns', icon: Megaphone, perm: 'campaigns.view' },
      { label: 'AI Training', to: '/admin/ai-training', icon: GraduationCap, perm: 'ai_training.view' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Leads', to: '/admin/leads', icon: Users, perm: 'leads.view' },
      { label: 'Calls & Recordings', to: '/admin/calls', icon: Phone, perm: 'calls.view' },
      { label: 'Activity', to: '/admin/activity', icon: Activity, perm: 'activity.view' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', to: '/admin/users', icon: ShieldCheck, perm: 'users.manage' },
      { label: 'Permissions', to: '/admin/permissions', icon: KeyRound, perm: 'users.manage' },
      { label: 'Costs', to: '/admin/costs', icon: DollarSign, perm: 'costs.view' },
      { label: 'Settings', to: '/admin/settings', icon: Settings, perm: 'settings.view' },
    ],
  },
]

export function navigationFor(zone: Zone, session?: import('@/lib/permissions').AccessSession | null) {
  const sections = zone === 'admin' ? adminNavigation : clientNavigation
  if (zone !== 'admin' || session?.role !== 'admin') return sections
  // Role "admin": show only the console areas the session is granted.
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canUse(session, item.perm)),
    }))
    .filter((section) => section.items.length > 0)
}
