import type { ComponentProps, ElementType } from 'react'
import { motion, type Variants } from 'motion/react'
import { fadeUp, staggerContainer } from '@/lib/motion'

type MotionTag = 'div' | 'section' | 'ul' | 'li' | 'article' | 'tr' | 'tbody'

interface StaggerProps extends ComponentProps<typeof motion.div> {
  as?: MotionTag
  stagger?: number
  delay?: number
}

/**
 * Container that staggers its `<Reveal>` children in. Use once per section
 * rather than animating every element independently.
 */
export function Stagger({ as = 'div', stagger = 0.045, delay = 0, children, ...props }: StaggerProps) {
  const Comp = motion[as] as ElementType
  return (
    <Comp variants={staggerContainer(stagger, delay)} initial="hidden" animate="show" {...props}>
      {children}
    </Comp>
  )
}

interface RevealProps extends ComponentProps<typeof motion.div> {
  as?: MotionTag
  variants?: Variants
}

/** Child of `<Stagger>`. Fades and lifts in with a spring. */
export function Reveal({ as = 'div', variants = fadeUp, children, ...props }: RevealProps) {
  const Comp = motion[as] as ElementType
  return (
    <Comp variants={variants} {...props}>
      {children}
    </Comp>
  )
}
