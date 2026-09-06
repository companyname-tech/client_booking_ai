import { NavLink, Outlet } from 'react-router-dom'
import { motion } from 'motion/react'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { PageTransition } from '@/components/motion/PageTransition'

const TABS = [
  { to: '/client/ai', label: 'Command Center', end: true },
  { to: '/client/ai/conversations', label: 'Conversations' },
  { to: '/client/ai/calls', label: 'Calls' },
  { to: '/client/ai/learning', label: 'Learning' },
  { to: '/client/ai/performance', label: 'Performance' },
  { to: '/client/ai/agents', label: 'Agents' },
]

export default function AILayout() {
  return (
    <PageTransition>
      <PageContainer className="space-y-6 pb-8">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="AI" context="Command Center" />}
          title="AI Command Center"
          description="Your booking agent is operating continuously across your active campaigns."
        >
          <nav className="flex max-w-full gap-1 overflow-x-auto scrollbar-none hairline-b" aria-label="AI sections">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'interactive relative shrink-0 px-2.5 py-2 text-sm font-medium',
                    isActive ? 'text-fg' : 'text-fg-muted hover:text-fg-secondary',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {tab.label}
                    {isActive && (
                      <motion.span layoutId="ai-tab" transition={spring} className="absolute inset-x-2 bottom-0 h-px bg-fg" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </PageHeader>
        <Outlet />
      </PageContainer>
    </PageTransition>
  )
}
