import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { backdropVariants, modalVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useScrollLock } from '@/hooks/useScrollLock'
import { Button } from './Button'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Hide the header entirely (e.g. for the command menu). */
  bare?: boolean
  className?: string
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, description, children, footer, size = 'md', bare, className }: ModalProps) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    // Move focus into the dialog for keyboard users.
    const t = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>('[data-autofocus], input, button')
      el?.focus()
    }, 20)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]">
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${id}-title` : undefined}
            aria-describedby={description ? `${id}-desc` : undefined}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn('surface-overlay relative w-full overflow-hidden', sizeClasses[size], className)}
          >
            {!bare && (
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  {title && (
                    <h2 id={`${id}-title`} className="text-md font-semibold text-fg">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={`${id}-desc`} className="mt-0.5 text-sm text-fg-muted">
                      {description}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
            )}
            {children}
            {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
