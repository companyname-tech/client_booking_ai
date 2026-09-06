import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Check } from 'lucide-react'
import { popVariants } from '@/lib/motion'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useShell } from './ShellContext'
import { repo } from '@/data/repository'
import { NOW } from '@/data/time'
import { useDismiss } from '@/hooks/useDismiss'
import { Button } from '@/components/ui/Button'
import { StatusDot } from '@/components/ui/StatusDot'
import { Tooltip } from '@/components/ui/Tooltip'

export function NotificationButton() {
  const { zone } = useShell()
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, [ref])

  const adminItems = repo.getAdminNotifications()
  const clientItems = repo.getActivity(5)
  const items = zone === 'admin'
    ? adminItems.map((n) => ({ id: n.id, title: n.title, description: n.description, timestamp: n.timestamp, tone: n.tone }))
    : clientItems
  const unread = read ? 0 : (zone === 'admin' ? repo.getAdminUnreadCount() : 3)

  return (
    <div ref={ref} className="relative">
      <Tooltip content="Notifications" side="bottom">
        <Button
          variant="ghost"
          size="icon"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((o) => !o)}
          className={cn('relative', open && 'bg-white/[0.06] text-fg')}
        >
          <Bell className="size-4" strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-accent opacity-60 motion-safe:animate-ping-ring" />
              <span className="relative size-1.5 rounded-full bg-accent ring-2 ring-bg" />
            </span>
          )}
        </Button>
      </Tooltip>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            variants={popVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ originY: 0, originX: 1 }}
            className="surface-overlay absolute right-0 top-[calc(100%+8px)] z-50 w-[min(92vw,360px)] overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unread > 0 && (
                  <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-2xs font-medium text-accent tabular">{unread} new</span>
                )}
              </div>
              <Button variant="ghost" size="sm" leadingIcon={<Check />} onClick={() => { setRead(true); if (zone === 'admin') repo.markAdminNotificationsRead() }} disabled={read}>
                Mark all read
              </Button>
            </div>
            <ul className="max-h-[360px] overflow-y-auto py-1">
              {items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={close}
                    className="interactive flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03]"
                  >
                    <span className="mt-1.5">
                      <StatusDot tone={item.tone} live={i === 0 && !read} size={7} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-sm', i < unread ? 'font-medium text-fg' : 'text-fg-secondary')}>
                        {item.title}
                      </span>
                      {item.description && <span className="block truncate text-xs text-fg-muted">{item.description}</span>}
                    </span>
                    <span className="shrink-0 pt-0.5 text-2xs text-fg-muted tabular">{formatRelativeTime(item.timestamp, NOW)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
