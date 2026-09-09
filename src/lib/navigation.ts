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
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Phone,
  PhoneOff,
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
      { label: 'Campaigns', to: '/client/campaigns', icon: Megaphone, perm: 'campaigns.view' },
    ],
  },
  {
    label: 'AI',
    items: [
      { label: 'AI Command Center', to: '/client/ai', icon: Bot, badge: 'Live', badgeTone: 'accent', perm: 'ai_training.view' },
      { label: 'Conversations', to: '/client/ai/conversations', icon: MessageSquare, perm: 'ai_training.view' },
      { label: 'Learning', to: '/client/ai/learning', icon: GraduationCap, perm: 'ai_training.view' },
      { label: 'Performance', to: '/client/ai/performance', icon: Activity, perm: 'ai_training.view' },
    ],
  },
  {
    label: 'Analytics',
    items: [{ label: 'Analytics', to: '/client/analytics', icon: Activity }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Calls & Recordings', to: '/client/recordings', icon: Phone, perm: 'calls.view' },
      { label: 'Calendar', to: '/client/calendar', icon: Calendar },
      { label: 'Bookings', to: '/client/bookings', icon: Calendar },
      { label: 'Downloads', to: '/client/downloads', icon: Download },
    ],
  },
  {
    label: 'Messaging',
    items: [
      { label: 'Email', to: '/client/messaging/email', icon: Mail },
      { label: 'WhatsApp', to: '/client/messaging/whatsapp', icon: MessageCircle },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Settings', to: '/client/settings', icon: Settings, perm: 'settings.view' },
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
    label: 'Messaging',
    items: [
      { label: 'Email', to: '/admin/messaging/email', icon: Mail },
      { label: 'WhatsApp', to: '/admin/messaging/whatsapp', icon: MessageCircle },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', to: '/admin/users', icon: ShieldCheck, perm: 'users.manage' },
      { label: 'Permissions', to: '/admin/permissions', icon: KeyRound, perm: 'users.manage' },
      { label: 'Do-not-contact', to: '/admin/do-not-contact', icon: PhoneOff, perm: 'users.manage' },
      { label: 'Costs', to: '/admin/costs', icon: DollarSign, perm: 'costs.view' },
      { label: 'Settings', to: '/admin/settings', icon: Settings, perm: 'settings.view' },
    ],
  },
]

/**
 * Navigation for a zone, filtered by the session's grants when the session is
 * permission-restricted: role "admin" in the admin zone (deny-by-default) and
 * client_user sessions WITH stored grants in the client zone (empty grants =
 * legacy full scoped access). super_admin and unrestricted client_user see
 * everything. Items without a `perm` (workspace internals / overview) stay
 * visible for restricted client_user sessions that hold any console view.
 */
export function navigationFor(zone: Zone, session?: import('@/lib/permissions').AccessSession | null) {
  const sections = zone === 'admin' ? adminNavigation : clientNavigation
  const perms = session?.permissions ?? []
  const restricted =
    (session?.role === 'admin' && zone === 'admin') ||
    (session?.role === 'client_user' && zone === 'client' && perms.length > 0)
  if (!restricted) return sections
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canUse(session, item.perm)),
    }))
    .filter((section) => section.items.length > 0)
}
