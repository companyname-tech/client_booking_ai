import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Menu, Search } from 'lucide-react'
import { navigationFor } from '@/lib/navigation'
import { cn, isMac } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Kbd } from '@/components/ui/Kbd'
import { StatusDot } from '@/components/ui/StatusDot'
import { BrandLogo } from './BrandLogo'
import { NotificationButton } from './NotificationButton'
import { useShell } from './ShellContext'

function useBreadcrumb() {
  const { pathname } = useLocation()
  const { zone } = useShell()
  const sections = navigationFor(zone)
  for (const section of sections) {
    for (const item of section.items) {
      if (pathname === item.to || pathname.startsWith(item.to + '/')) {
        return { section: section.label, item: item.label, to: item.to, nested: pathname !== item.to }
      }
    }
  }
  return { section: zone === 'admin' ? 'Admin' : 'Workspace', item: 'Campaigns', to: `/${zone}/campaigns`, nested: true }
}

export function TopBar() {
  const { setMobileOpen, setCommandOpen, zone } = useShell()
  const crumb = useBreadcrumb()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/80 px-3 backdrop-blur-md sm:px-5 lg:px-6',
        'supports-[backdrop-filter]:bg-bg/70',
      )}
    >
      {/* Mobile: menu + brand */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="size-4" strokeWidth={1.75} />
      </Button>
      <Link to={`/${zone}/overview`} className="ring-focus rounded-sm outline-none lg:hidden" aria-label="Home">
        <BrandLogo variant="mark" height={22} />
      </Link>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        <span className="text-fg-muted">{crumb.section}</span>
        <ChevronRight className="size-3.5 text-fg-faint" aria-hidden />
        {crumb.nested ? (
          <Link to={crumb.to} className="interactive text-fg-secondary hover:text-fg">
            {crumb.item}
          </Link>
        ) : (
          <span className="font-medium text-fg" aria-current="page">
            {crumb.item}
          </span>
        )}
      </nav>

      <div className="flex-1" />

      {/* System status — hidden on the smallest screens */}
      <div className="hidden items-center gap-2 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-fg-secondary md:flex">
        <StatusDot tone="success" live size={6} />
        <span>
          AI systems <span className="font-medium text-fg">operational</span>
        </span>
      </div>

      {/* Command trigger */}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        aria-label="Open command menu"
        className={cn(
          'interactive ring-focus group flex h-8 items-center gap-2 rounded-md border border-line bg-surface-2 text-sm text-fg-muted outline-none hover:border-line-strong hover:bg-surface-3 hover:text-fg-secondary',
          'w-8 justify-center px-0 sm:w-auto sm:justify-start sm:px-2.5 sm:pr-1.5 lg:w-60',
        )}
      >
        <Search className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="hidden flex-1 text-left sm:block">Search or jump to…</span>
        <span className="hidden items-center gap-0.5 sm:flex">
          <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <NotificationButton />
    </header>
  )
}
