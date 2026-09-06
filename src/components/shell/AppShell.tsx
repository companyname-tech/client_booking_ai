import { Suspense } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Zone } from '@/lib/navigation'
import { spring } from '@/lib/motion'
import { Drawer } from '@/components/ui/Drawer'
import { PageLoading } from '@/components/ui/LoadingState'
import { CommandMenu } from './CommandMenu'
import { ShellProvider, useShell } from './ShellContext'
import { Sidebar, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH, SidebarContent } from './Sidebar'
import { TopBar } from './TopBar'

function ShellFrame() {
  const { collapsed, mobileOpen, setMobileOpen, zone, isDesktop } = useShell()
  const location = useLocation()
  const outlet = useOutlet()
  const reduce = useReducedMotion()
  const offset = isDesktop ? (collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) : 0

  // Animate exit/enter only across top-level sections, not nested tab changes.
  const pageKey = location.pathname.split('/').slice(0, 4).join('/')

  return (
    <div className="min-h-dvh bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <Sidebar />

      <Drawer open={mobileOpen && !isDesktop} onClose={() => setMobileOpen(false)} side="left" label="Navigation">
        <SidebarContent collapsed={false} zone={zone} />
      </Drawer>

      <motion.div
        initial={false}
        animate={{ paddingLeft: offset }}
        transition={reduce ? { duration: 0 } : spring}
        className="flex min-h-dvh flex-col"
        style={{ paddingLeft: offset }}
      >
        <TopBar />
        <main id="main" className="relative flex-1">
          {/* Ambient depth: a very faint radial wash at the top of the canvas. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(124_156_255/0.06),transparent_70%)]"
          />
          <AnimatePresence mode="wait" initial={false}>
            <div key={pageKey} className="relative">
              <Suspense fallback={<PageLoading />}>{outlet}</Suspense>
            </div>
          </AnimatePresence>
        </main>
      </motion.div>

      <CommandMenu />
    </div>
  )
}

export function AppShell({ zone }: { zone: Zone }) {
  return (
    <ShellProvider zone={zone}>
      <ShellFrame />
    </ShellProvider>
  )
}
