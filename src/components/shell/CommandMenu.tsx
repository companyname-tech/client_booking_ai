import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  CornerDownLeft,
  Disc3,
  GraduationCap,
  Megaphone,
  MessageSquare,
  Plug,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { repo } from '@/data/repository'
import { campaignStatusMeta } from '@/lib/status'
import { Kbd } from '@/components/ui/Kbd'
import { Modal } from '@/components/ui/Modal'
import { StatusDot } from '@/components/ui/StatusDot'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useShell } from './ShellContext'

interface Command {
  id: string
  label: string
  hint?: string
  icon: ReactNode
  group: 'Actions' | 'Navigate' | 'Campaigns'
  keywords?: string
  run: () => void
}

function useCommands(): Command[] {
  const navigate = useNavigate()
  const { zone } = useShell()

  // Static navigation commands resolve synchronously; data-backed commands
  // (campaigns, clients, conversations, leads) are fetched async below and
  // render as empty while loading / on error rather than crashing.
  const nav = useMemo<Command[]>(() => {
    const base = `/${zone}`
    return [
      ...(zone === 'admin'
        ? [
            { id: 'approvals', label: 'Open approvals queue', icon: <CheckCircle2 />, group: 'Actions' as const, run: () => navigate('/admin/approvals') },
            { id: 'ai-training', label: 'Open AI training', icon: <GraduationCap />, group: 'Actions' as const, run: () => navigate('/admin/ai-training') },
            { id: 'clients', label: 'Search clients', icon: <Users />, group: 'Actions' as const, run: () => navigate('/admin/clients') },
          ]
        : [
            { id: 'create', label: 'Create campaign', hint: 'New', icon: <Plus />, group: 'Actions' as const, run: () => navigate('/client/campaigns/new') },
            { id: 'ai-center', label: 'Open AI Command Center', icon: <Bot />, group: 'Actions' as const, run: () => navigate('/client/ai') },
            { id: 'ai-conversations', label: 'Search conversations', icon: <MessageSquare />, group: 'Actions' as const, run: () => navigate('/client/ai/conversations') },
            { id: 'connect', label: 'Manage connections', hint: 'Settings → Connection', icon: <Plug />, group: 'Actions' as const, run: () => navigate('/client/settings?tab=connection') },
          ]),
      { id: 'search-campaigns', label: 'Search campaigns', icon: <Megaphone />, group: 'Actions', run: () => navigate(`${base}/campaigns`) },
      { id: 'analytics', label: 'Open analytics', icon: <BarChart3 />, group: 'Navigate', run: () => navigate(`${base}/analytics`) },
      { id: 'recordings', label: 'Open calls & recordings', icon: <Disc3 />, group: 'Navigate', run: () => navigate(`${base}/recordings`) },
      { id: 'agents', label: 'Open AI Command Center', icon: <Bot />, group: 'Navigate', run: () => navigate(zone === 'client' ? '/client/ai' : `${base}/agents`) },
      { id: 'settings', label: 'Go to settings', icon: <Settings />, group: 'Navigate', keywords: 'preferences', run: () => navigate(`${base}/settings`) },
      {
        id: 'zone',
        label: zone === 'admin' ? 'Switch to Client Zone' : 'Switch to Super Admin',
        icon: <Sparkles />,
        group: 'Navigate',
        run: () => navigate(zone === 'admin' ? '/client/overview' : '/admin/overview'),
      },
    ]
  }, [navigate, zone])

  const { data } = useAsyncData(
    async () => {
      const campaigns = await repo.getCampaigns()
      const clients = zone === 'admin' ? (await repo.getClients({ pageSize: 100 })).items : []
      const conversations = zone === 'client' ? await repo.getAIConversations() : []
      return { campaigns, clients, conversations }
    },
    [zone],
  )

  return useMemo<Command[]>(() => {
    const base = `/${zone}`
    const campaigns: Command[] = (data?.campaigns ?? []).map((c) => ({
      id: `c-${c.id}`,
      label: c.name,
      hint: campaignStatusMeta[c.status].label,
      icon: <StatusDot tone={campaignStatusMeta[c.status].tone} size={7} />,
      group: 'Campaigns',
      keywords: `${c.id} ${c.targetAudience}`,
      run: () => navigate(zone === 'admin' ? `/admin/campaigns/${c.id}/review` : `${base}/campaigns/${c.id}`),
    }))
    const clientCommands: Command[] = zone === 'admin'
      ? (data?.clients ?? []).map((cl) => ({
          id: `cl-${cl.id}`,
          label: cl.name,
          hint: 'Client',
          icon: <Users />,
          group: 'Navigate' as const,
          keywords: cl.industry,
          run: () => navigate(`/admin/clients/${cl.id}`),
        }))
      : []
    const conversationCommands: Command[] = zone === 'client'
      ? (data?.conversations ?? []).slice(0, 8).map((c) => ({
          id: `conv-${c.id}`,
          label: c.leadName,
          hint: c.company,
          icon: <MessageSquare />,
          group: 'Navigate' as const,
          keywords: `${c.company} ${c.campaignName}`,
          run: () => navigate(`/client/ai/conversations/${c.id}`),
        }))
      : []
    return [...nav, ...clientCommands, ...conversationCommands, ...campaigns]
  }, [nav, data, navigate, zone])
}

const GROUP_ORDER: Command['group'][] = ['Actions', 'Navigate', 'Campaigns']

export function CommandMenu() {
  const { commandOpen, setCommandOpen } = useShell()
  return (
    <Modal open={commandOpen} onClose={() => setCommandOpen(false)} bare size="md" className="max-w-xl">
      {/* Mounted fresh on every open, so query/selection reset without effects. */}
      <CommandPalette onClose={() => setCommandOpen(false)} />
    </Modal>
  )
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const commands = useCommands()
  const [query, setQueryState] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const setQuery = (q: string) => {
    setQueryState(q)
    setActive(0)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''}`.toLowerCase().includes(q))
  }, [commands, query])

  const grouped = useMemo(
    () => GROUP_ORDER.map((g) => ({ group: g, items: filtered.filter((c) => c.group === g) })).filter((g) => g.items.length),
    [filtered],
  )

  // Keep the active row in view while navigating with the keyboard.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const run = (cmd: Command) => {
    onClose()
    cmd.run()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[active]
      if (cmd) run(cmd)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-4 shrink-0 text-fg-muted" strokeWidth={1.75} />
        <input
          data-autofocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded
          aria-controls="command-list"
          aria-activedescendant={filtered[active] ? `cmd-${filtered[active].id}` : undefined}
          aria-label="Command menu"
          placeholder="Type a command or search…"
          autoComplete="off"
          spellCheck={false}
          className="h-12 flex-1 bg-transparent text-md text-fg placeholder:text-fg-muted focus:outline-none"
        />
        <Kbd>esc</Kbd>
      </div>

      <div ref={listRef} id="command-list" role="listbox" className="max-h-[min(60vh,400px)] overflow-y-auto p-1.5">
        {grouped.length === 0 && (
          <div className="px-3 py-10 text-center text-sm text-fg-muted">
            No results for <span className="text-fg-secondary">“{query}”</span>
          </div>
        )}
        {grouped.map(({ group, items }) => (
          <div key={group} className="mb-1 last:mb-0">
            <div className="label-caps px-2.5 pb-1 pt-2">{group}</div>
            {items.map((cmd) => {
              const index = filtered.indexOf(cmd)
              const isActive = index === active
              return (
                <button
                  key={cmd.id}
                  id={`cmd-${cmd.id}`}
                  role="option"
                  aria-selected={isActive}
                  data-index={index}
                  type="button"
                  onMouseMove={() => !isActive && setActive(index)}
                  onClick={() => run(cmd)}
                  className={cn(
                    'relative flex h-10 w-full items-center gap-3 rounded-md px-2.5 text-left text-sm outline-none',
                    isActive ? 'text-fg' : 'text-fg-secondary',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="command-active"
                      transition={spring}
                      aria-hidden
                      className="absolute inset-0 rounded-md bg-white/[0.06]"
                    />
                  )}
                  <span
                    className={cn(
                      'relative flex size-6 shrink-0 items-center justify-center rounded-sm [&>svg]:size-4',
                      isActive ? 'text-accent' : 'text-fg-muted',
                    )}
                  >
                    {cmd.icon}
                  </span>
                  <span className="relative min-w-0 flex-1 truncate">{cmd.label}</span>
                  {cmd.hint && <span className="relative truncate text-xs text-fg-muted">{cmd.hint}</span>}
                  {isActive && <ArrowRight className="relative size-3.5 text-fg-muted" aria-hidden />}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-2xs text-fg-muted">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-violet" />
          <span>AI command surface</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>
              <CornerDownLeft className="size-2.5" />
            </Kbd>{' '}
            select
          </span>
        </div>
      </div>
    </>
  )
}
