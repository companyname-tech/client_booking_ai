import type { CostBalance, CostSummary } from '@/types/costs'
import { fmtInt, fmtUSD } from '@/lib/costs'

export interface CostCardsProps {
  balance: CostBalance | null
  summary: CostSummary | null
}

function balanceSubtitle(balance: CostBalance | null): string {
  if (!balance) return 'balance unavailable'
  if (balance.reason === 'no_session_token')
    return "set OPENAI_SESSION_TOKEN in backend/.env (the OPENAI_API_KEY can't fetch balance)"
  return balance.message ?? 'balance unavailable'
}

export function CostCards({ balance, summary }: CostCardsProps) {
  const hasBalance = balance?.ok === true && typeof balance?.total_available === 'number'
  const avail = balance?.total_available ?? 0
  const exhausted = hasBalance && avail <= 0
  const low = hasBalance && avail > 0 && avail < 5

  let balanceValue = '—'
  let balanceSub = balanceSubtitle(balance)
  if (hasBalance) {
    balanceValue = fmtUSD(avail)
    balanceSub =
      balance.total_used !== undefined && balance.total_granted !== undefined
        ? `used ${fmtUSD(balance.total_used)} of ${fmtUSD(balance.total_granted)} granted`
        : 'credit remaining'
    if (balance.as_of) balanceSub += ` · ${balance.as_of.slice(11, 19)} UTC`
  }

  const cards = [
    { label: 'OpenAI balance', value: balanceValue, sub: balanceSub, tone: exhausted ? 'danger' : low ? 'warning' : 'ok' },
    { label: 'Total spend', value: fmtUSD(summary?.total_cost_usd), sub: 'USD — estimated from token usage', tone: 'ok' },
    { label: 'AI calls', value: fmtInt(summary?.total_events), sub: 'usage events recorded', tone: 'ok' },
    { label: 'Input tokens', value: fmtInt(summary?.total_input_tokens), sub: 'incl. audio + cached', tone: 'ok' },
    { label: 'Output tokens', value: fmtInt(summary?.total_output_tokens), sub: 'incl. audio', tone: 'ok' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="surface p-4">
          <div className="text-2xs font-medium uppercase tracking-wider text-fg-muted">{c.label}</div>
          <div
            className={`mt-2 text-lg font-semibold ${
              c.tone === 'danger' ? 'text-danger' : c.tone === 'warning' ? 'text-warning' : 'text-fg'
            }`}
          >
            {c.value}
          </div>
          <div className="mt-1 text-xs text-fg-muted">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
