import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { backdropVariants, drawerVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useScrollLock } from '@/hooks/useScrollLock'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  side?: 'left' | 'right'
  label: string
  children: ReactNode
  className?: string
}

export function Drawer({ open, onClose, side = 'right', label, children, className }: DrawerProps) {
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
            aria-label={label}
            variants={drawerVariants(side)}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'absolute inset-y-0 flex w-[min(86vw,320px)] flex-col bg-surface-1 shadow-3',
              side === 'left' ? 'left-0 border-r border-line-strong' : 'right-0 border-l border-line-strong',
              className,
            )}
          >
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
