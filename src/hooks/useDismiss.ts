import { useEffect, type RefObject } from 'react'

/**
 * Closes a floating element on Escape or on pointer-down outside of it.
 */
export function useDismiss(
  open: boolean,
  onDismiss: () => void,
  refs: RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onDismiss()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (refs.some((r) => r.current?.contains(target))) return
      onDismiss()
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, onDismiss, refs])
}
