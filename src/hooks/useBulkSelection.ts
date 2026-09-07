import { useCallback, useMemo, useState } from 'react'

/**
 * useBulkSelection — checkbox selection state for list views.
 *
 * Tracks ids of the currently VISIBLE rows so "select all" only selects what
 * the user sees (search/filter/pagination apply first), and stale ids drop
 * out automatically after the list reloads.
 */
export function useBulkSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const everyVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id))
      if (everyVisibleSelected) {
        const next = new Set(prev)
        for (const id of visibleIds) next.delete(id)
        return next
      }
      const next = new Set(prev)
      for (const id of visibleIds) next.add(id)
      return next
    })
  }, [visibleIds])

  const clear = useCallback(() => setSelected(new Set()), [])

  // Selection is always pruned to rows that still exist in the current data —
  // after a delete + reload the gone ids stop counting automatically.
  const count = useMemo(
    () => visibleIds.reduce((n, id) => (selected.has(id) ? n + 1 : n), 0),
    [visibleIds, selected],
  )

  const allChecked = visibleIds.length > 0 && count === visibleIds.length
  const someChecked = count > 0 && !allChecked

  return { selected, toggle, toggleAll, clear, count, allChecked, someChecked }
}
