const PLACEHOLDERS: { token: string; meaning: string }[] = [
  { token: '{first_name}', meaning: 'lead contact first name' },
  { token: '{lead_name}', meaning: 'lead / business name' },
  { token: '{company}', meaning: 'prospect company' },
  { token: '{offer_name}', meaning: 'campaign name' },
  { token: '{agent_name}', meaning: 'assigned AI agent' },
  { token: '{booking_link}', meaning: 'booking (Meet) link' },
]

export function PlaceholderLegend() {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="mb-2 text-xs font-medium text-fg-secondary">Placeholders (resolved at send time)</p>
      <ul className="grid gap-1 sm:grid-cols-2">
        {PLACEHOLDERS.map((p) => (
          <li key={p.token} className="text-xs text-fg-muted">
            <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px] text-fg-secondary">{p.token}</code>
            <span className="ml-1.5">{p.meaning}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
