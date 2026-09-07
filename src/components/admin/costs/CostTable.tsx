import type { ReactNode } from 'react'

export interface CostTableProps {
  headers: string[]
  rows: ReactNode[][]
}

export function CostTable({ headers, rows }: CostTableProps) {
  if (rows.length === 0) {
    return <p className="py-3 text-sm text-fg-muted">No data yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {headers.map((h) => (
              <th
                key={h}
                className="px-2 py-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/50 last:border-0">
              {r.map((c, j) => (
                <td key={j} className="whitespace-nowrap px-2 py-2 text-fg-secondary">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
