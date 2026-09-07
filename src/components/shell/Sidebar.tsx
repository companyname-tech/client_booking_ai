import { memo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ChevronsUpDown, HelpCircle, LogOut, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react'
import type { NavItem, Zone } from '@/lib/navigation'
import { navigationFor } from '@/lib/navigation'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { repo } from '@/data/repository'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { Tooltip } from '@/components/ui/Tooltip'
import { useAsyncData } from '@/hooks/useAsyncData'
import { BrandLogo } from './BrandLogo'
import { useShell } from './ShellContext'

export const SIDEBAR_WIDTH = 240
export const SIDEBAR_COLLAPSED_WIDTH = 60

// ---------------------------------------------------------------------------

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon
  return (
    <Tooltip content={item.label} side="right" disabled={!collapsed} delay={80}>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            'group interactive ring-focus relative flex h-10 items-center rounded-md text-sm font-medium outline-none lg:h-8',
            collapsed ? 'justify-center' : 'gap-2.5 px-2.5',
            isActive ? 'text-fg' : 'text-fg-secondary hover:bg-white/[0.04] hover:text-fg',
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.span
                layoutId="sidebar-active"
                transition={spring}
                aria-hidden
                className="absolute inset-0 rounded-md bg-white/[0.06] shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]"
              >
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
              </motion.span>
            )}
            <Icon
              className={cn(
                'relative size-4 shrink-0 transition-colors',
                isActive ? 'text-accent' : 'text-fg-muted group-hover:text-fg-secondary',
              )}
              strokeWidth={1.75}
            />
            {!collapsed && <span className="relative min-w-0 flex-1 truncate">{item.label}</span>}
            {item.badge !== undefined && (
              <span
                className={cn(
                  'rounded-full text-[10px] font-semibold tabular leading-none',
                  collapsed
                    ? 'absolute right-1.5 top-1.5 size-1.5 p-0'
                    : 'relative min-w-[18px] px-1.5 py-[3px] text-center',
                  item.badgeTone === 'accent' && (collapsed ? 'bg-accent' : 'bg-accent-soft text-accent'),
                  item.badgeTone === 'warning' && (collapsed ? 'bg-warning' : 'bg-warning-soft text-warning'),
                  (!item.badgeTone || item.badgeTone === 'neutral') &&
                    (collapsed ? 'bg-fg-muted' : 'bg-white/[0.06] text-fg-muted'),
                )}
              >
                {!collapsed && item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </Tooltip>
  )
}

// ---------------------------------------------------------------------------

function WorkspaceSwitcher({ collapsed, zone }: { collapsed: boolean; zone: Zone }) {
  const navigate = useNavigate()
  const { data } = useAsyncData(async () => {
    const [client, clientsPage] = await Promise.all([repo.getCurrentClient(), repo.getClients({ pageSize: 100 })])
    return { client, clients: clientsPage.items }
  }, [])
  const client = data?.client
  const clients = data?.clients ?? []
  const isAdmin = zone === 'admin'

  return (
    <Dropdown
      side="top"
      align="start"
      width={248}
      className="w-full"
      sections={[
        {
          label: 'Workspaces',
          items: clients.map((c) => ({
            id: c.id,
            label: c.name,
            description: c.industry,
            selected: !isAdmin && c.id === client?.id,
            icon: <Avatar name={c.name} size="xs" />,
            onSelect: () => navigate('/client/overview'),
          })),
        },
        {
          items: [
            {
              id: 'admin',
              label: 'Super Admin console',
              description: 'Internal operations',
              icon: <ShieldCheck />,
              selected: isAdmin,
              onSelect: () => navigate('/admin/overview'),
            },
          ],
        },
      ]}
      trigger={({ toggle, ...a11y }) => (
        <Tooltip content={isAdmin ? 'Super Admin' : client?.name ?? ''} side="right" disabled={!collapsed} delay={80}>
          <button
            type="button"
            onClick={toggle}
            {...a11y}
            className={cn(
              'interactive ring-focus flex h-9 w-full items-center rounded-md text-left outline-none hover:bg-white/[0.04]',
              collapsed ? 'justify-center' : 'gap-2.5 px-2',
            )}
          >
            {isAdmin ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-soft text-violet ring-1 ring-violet/25">
                <ShieldCheck className="size-3.5" />
              </span>
            ) : (
              <Avatar name={client?.name ?? ''} size="sm" className="rounded-md" />
            )}
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{isAdmin ? 'Super Admin' : client?.name ?? ''}</span>
                  <span className="block truncate text-2xs text-fg-muted">
                    {isAdmin ? 'Internal console' : client ? `${client.plan[0].toUpperCase()}${client.plan.slice(1)} plan` : ''}
                  </span>
                </span>
                <ChevronsUpDown className="size-3.5 shrink-0 text-fg-muted" />
              </>
            )}
          </button>
        </Tooltip>
      )}
    />
  )
}

function UserMenu({ collapsed, zone }: { collapsed: boolean; zone: Zone }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data } = useAsyncData(async () => (zone === 'admin' ? repo.getSuperAdminUser() : repo.getCurrentUser()), [zone])
  const user = data
  return (
    <Dropdown
      side="top"
      align="start"
      width={220}
      className="w-full"
      sections={[
        {
          items: [
            { id: 'profile', label: 'Profile', icon: <UserRound />, onSelect: () => navigate(`/${zone}/settings`) },
            { id: 'settings', label: 'Settings', icon: <Settings />, shortcut: '⌘,', onSelect: () => navigate(`/${zone}/settings`) },
          ],
        },
        {
          items: [{
            id: 'signout',
            label: 'Sign out',
            icon: <LogOut />,
            destructive: true,
            onSelect: () => {
              logout()
              navigate('/login')
            },
          }],
        },
      ]}
      trigger={({ toggle, ...a11y }) => (
        <Tooltip content={user?.name ?? ''} side="right" disabled={!collapsed} delay={80}>
          <button
            type="button"
            onClick={toggle}
            {...a11y}
            className={cn(
              'interactive ring-focus flex h-9 w-full items-center rounded-md text-left outline-none hover:bg-white/[0.04]',
              collapsed ? 'justify-center' : 'gap-2.5 px-2',
            )}
          >
            <Avatar name={user?.name ?? ''} size="sm" />
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{user?.name ?? ''}</span>
                <span className="block truncate text-2xs text-fg-muted">{user?.email ?? ''}</span>
              </span>
            )}
          </button>
        </Tooltip>
      )}
    />
  )
}

// ---------------------------------------------------------------------------

/** Shared between the desktop rail and the mobile drawer. */
export const SidebarContent = memo(function SidebarContent({ collapsed, zone }: { collapsed: boolean; zone: Zone }) {
  const { toggleCollapsed, isDesktop, setMobileOpen } = useShell()
  const sections = navigationFor(zone)
  const { data: stats } = useAsyncData(async () => {
    const [client, campaigns, agents] = await Promise.all([
      repo.getCurrentClient().catch(() => null),
      repo.getCampaigns().catch(() => []),
      repo.listPronunciationAgents().catch(() => []),
    ])
    const all = campaigns ?? []
    const scoped = client ? all.filter((c) => c.clientId === client.id) : all
    return {
      campaigns: zone === 'admin' ? all.length : scoped.length,
      agents: (agents ?? []).length,
    }
  }, [zone])
  const liveSections = sections.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.to.endsWith('/campaigns') && stats != null
        ? { ...item, badge: stats.campaigns, badgeTone: zone === 'admin' ? ('warning' as const) : ('accent' as const) }
        : item,
    ),
  }))

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn('flex h-14 shrink-0 items-center', collapsed ? 'justify-center px-0' : 'justify-between pl-4 pr-2')}>
        <NavLink to={`/${zone}/overview`} className="ring-focus rounded-sm outline-none" aria-label="AI Booking Agent — home">
          <BrandLogo variant={collapsed ? 'mark' : 'full'} height={collapsed ? 26 : 22} />
        </NavLink>
        {!isDesktop && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="interactive ring-focus flex size-9 items-center justify-center rounded-md text-fg-muted outline-none hover:bg-white/[0.05] hover:text-fg"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        )}
        {isDesktop && !collapsed && (
          <Tooltip content="Collapse sidebar · [" side="right" delay={400}>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="interactive ring-focus flex size-7 items-center justify-center rounded-md text-fg-muted outline-none hover:bg-white/[0.05] hover:text-fg"
            >
              <PanelLeftClose className="size-4" strokeWidth={1.75} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Primary" className={cn('flex-1 overflow-y-auto scrollbar-none', collapsed ? 'px-2.5' : 'px-3')}>
        {liveSections.map((section, i) => (
          <div key={section.label} className={cn(i > 0 && 'mt-4')}>
            {collapsed ? (
              i > 0 && <div className="mx-2 mb-2 border-t border-line" aria-hidden />
            ) : (
              <div className="label-caps mb-1.5 px-2.5">{section.label}</div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('shrink-0 border-t border-line pt-2', collapsed ? 'px-2.5 pb-2' : 'px-3 pb-3')}>
        {!collapsed && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-gradient-to-br from-violet-soft to-accent-soft px-2.5 py-2 ring-1 ring-inset ring-white/[0.06]">
            <Sparkles className="size-3.5 shrink-0 text-violet" />
            <p className="text-2xs leading-tight text-fg-secondary">
              <span className="font-medium text-fg">{stats?.agents ?? '…'} agents</span> operating across{' '}
              <span className="font-medium text-fg">{stats?.campaigns ?? '…'} campaigns</span>
            </p>
          </div>
        )}
        <Tooltip content="Help & docs" side="right" disabled={!collapsed} delay={80}>
          <a
            href="#help"
            className={cn(
              'interactive ring-focus flex h-8 items-center rounded-md text-sm font-medium text-fg-secondary outline-none hover:bg-white/[0.04] hover:text-fg',
              collapsed ? 'justify-center' : 'gap-2.5 px-2.5',
            )}
          >
            <HelpCircle className="size-4 text-fg-muted" strokeWidth={1.75} />
            {!collapsed && <span>Help</span>}
          </a>
        </Tooltip>
        <div className="mt-1 space-y-0.5">
          <WorkspaceSwitcher collapsed={collapsed} zone={zone} />
          <UserMenu collapsed={collapsed} zone={zone} />
        </div>
        {isDesktop && collapsed && (
          <Tooltip content="Expand sidebar · [" side="right" delay={80}>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              className="interactive ring-focus mt-1 flex h-8 w-full items-center justify-center rounded-md text-fg-muted outline-none hover:bg-white/[0.05] hover:text-fg"
            >
              <PanelLeftOpen className="size-4" strokeWidth={1.75} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------

/** Desktop rail. Width animates; content swaps between full and icon-only. */
export function Sidebar() {
  const { collapsed, zone } = useShell()
  const reduce = useReducedMotion()
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <motion.aside
      initial={false}
      animate={{ width }}
      transition={reduce ? { duration: 0 } : spring}
      className="fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-surface-1 lg:block"
      style={{ width }}
    >
      <SidebarContent collapsed={collapsed} zone={zone} />
    </motion.aside>
  )
}
