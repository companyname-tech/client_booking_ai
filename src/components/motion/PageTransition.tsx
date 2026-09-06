import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { pageVariants } from '@/lib/motion'

/**
 * Wraps a routed page. Pair with `AnimatePresence mode="wait"` keyed by
 * pathname in the shell to get enter/exit transitions.
 */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className={className}>
      {children}
    </motion.div>
  )
}
