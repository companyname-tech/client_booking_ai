import type { Transition, Variants } from 'motion/react'

/**
 * Shared animation primitives. Every animated component should pull from
 * here so the whole product moves with one consistent "voice".
 *
 * Principles: fast, spring-like, opacity + transform only.
 */

export const spring: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 42,
  mass: 0.9,
}

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 36,
  mass: 1,
}

export const tweenFast: Transition = {
  duration: 0.16,
  ease: [0.16, 1, 0.3, 1],
}

export const tweenBase: Transition = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1],
}

/** Page-level enter/exit. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { ...tweenBase, duration: 0.26 } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } },
}

/** Children of a staggered container. */
export const staggerContainer = (stagger = 0.04, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: spring },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: tweenBase },
}

/** Overlay surfaces: popovers, menus, tooltips. */
export const popVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.98, y: -2, transition: { duration: 0.1 } },
}

export const tooltipVariants: Variants = {
  initial: { opacity: 0, y: 4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: tweenFast },
  exit: { opacity: 0, y: 2, transition: { duration: 0.08 } },
}

/** Centered modal dialog. */
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.12 } },
}

export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

/** Side drawer sliding in from the left or right. */
export const drawerVariants = (side: 'left' | 'right' = 'right'): Variants => {
  const offset = side === 'left' ? '-100%' : '100%'
  return {
    initial: { x: offset },
    animate: { x: 0, transition: spring },
    exit: { x: offset, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
  }
}
