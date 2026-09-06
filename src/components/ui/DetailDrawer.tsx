import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { backdropVariants, drawerVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useScrollLock } from '@/hooks/useScrollLock'
import { Button } from './Button'

export interface DetailDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Wide detail drawer for leads, calls, recordings — full-screen on mobile. */
export function DetailDrawer({ open, onClose, title, subtitle, children, footer, className }: DetailDrawerProps) {
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={drawerVariants('right')}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'absolute inset-y-0 right-0 flex w-full flex-col border-l border-line-strong bg-surface-1 shadow-3 sm:w-[min(100vw,480px)]',
              className,
            )}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-fg">{title}</h2>
                {subtitle && <p className="mt-0.5 truncate text-sm text-fg-muted">{subtitle}</p>}
              </div>
              <Button variant="ghost" size="sm" aria-label="Close" onClick={onClose} className="shrink-0">
                <X className="size-4" />
              </Button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <footer className="shrink-0 border-t border-line px-5 py-3">{footer}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
