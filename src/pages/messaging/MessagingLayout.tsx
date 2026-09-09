import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, MessageCircle } from 'lucide-react'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { PageTransition } from '@/components/motion/PageTransition'
import { useAuth } from '@/contexts/AuthContext'

function messagingTabs(zone: 'client' | 'admin') {
  const base = zone === 'admin' ? '/admin/messaging' : '/client/messaging'
  return [
    { to: `${base}/email`, label: 'Email', icon: Mail },
    { to: `${base}/whatsapp`, label: 'WhatsApp', icon: MessageCircle },
  ]
}

export default function MessagingLayout({ zone = 'admin' }: { zone?: 'client' | 'admin' }) {
  const { session } = useAuth()
  const location = useLocation()
  const tabs = messagingTabs(zone)
  const channel = location.pathname.includes('/whatsapp') ? 'whatsapp' : 'email'

  return (
    <PageTransition>
      <PageContainer className="space-y-6 pb-8">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name={zone === 'admin' ? 'Super Admin' : session?.name ?? 'Workspace'} context="Messaging" />}
          title="Messaging"
          description="Compose campaign-scoped email and WhatsApp follow-ups. Save templates per campaign and preview how they appear in Gmail or WhatsApp."
        >
          <nav className="flex max-w-full gap-1 overflow-x-auto scrollbar-none hairline-b" aria-label="Messaging channels">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    'interactive relative flex shrink-0 items-center gap-1.5 px-2.5 py-2 text-sm font-medium',
                    isActive ? 'text-fg' : 'text-fg-muted hover:text-fg-secondary',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <tab.icon className="size-3.5" strokeWidth={1.75} />
                    {tab.label}
                    {isActive && (
                      <motion.span layoutId="messaging-tab" transition={spring} className="absolute inset-x-2 bottom-0 h-px bg-fg" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </PageHeader>
        <Outlet context={{ zone, channel }} />
      </PageContainer>
    </PageTransition>
  )
}
