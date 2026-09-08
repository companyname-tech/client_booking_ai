import { AudioWaveform, Bot, BrainCircuit, Mail, MessageSquare, Phone, Plug, Video, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { repo } from '@/data/repository'
import { useCampaignContext } from './campaignContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Reveal } from '@/components/motion/Reveal'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import type { ConnectionKey, ProviderConnection } from '@/types/settings'

const KEY_ICONS: Record<string, LucideIcon> = {
  openai: Bot,
  fish: AudioWaveform,
  deepseek: BrainCircuit,
  twilio: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  google_meet: Video,
  zoom: Video,
  telegram: MessageSquare,
}

/** Caption shown next to the masked credential so the user knows what it previews. */
const KEY_HINTS: Partial<Record<ConnectionKey, string>> = {
  twilio: 'Account SID',
  email: 'Credential',
  google_meet: 'Token',
}

const KIND_LABEL: Record<ProviderConnection['kind'], string> = {
  model: 'Model provider',
  channel: 'Channel',
  meeting: 'Meeting provider',
}

function ConnectionCard({ conn, onManage }: { conn: ProviderConnection; onManage: () => void }) {
  const Icon = KEY_ICONS[conn.key] ?? Plug
  const hint = KEY_HINTS[conn.key] ?? 'Token'
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-surface-3 ring-1 ring-white/[0.06]">
            <Icon className="size-5 text-fg-secondary" strokeWidth={1.75} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-fg">{conn.label}</h3>
              <span className="text-2xs text-fg-muted">{KIND_LABEL[conn.kind]}</span>
            </div>
            <p className="mt-0.5 text-xs text-fg-muted">{conn.description}</p>
          </div>
        </div>
        <StatusBadge tone={conn.configured ? 'success' : 'neutral'}>
          {conn.configured ? 'Connected' : 'Not connected'}
        </StatusBadge>
      </div>

      {conn.configured && conn.masked && (
        <p className="text-2xs text-fg-muted">
          {hint}: <span className="font-mono">{conn.masked}</span>
        </p>
      )}

      <Button variant={conn.configured ? 'secondary' : 'primary'} size="sm" className="self-start" onClick={onManage}>
        {conn.configured ? 'Manage in Settings' : 'Connect in Settings'}
      </Button>
    </Card>
  )
}

export default function CampaignIntegrations() {
  const { campaign, zone } = useCampaignContext()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsyncData(() => repo.getConnections())

  const manageHref = zone === 'admin' ? '/admin/settings' : '/client/settings?tab=connection'
  const goToSettings = () => navigate(manageHref)

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState title="No data" />

  return (
    <Reveal className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-fg">Integrations</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Real connection state for the tools used by <span className="text-fg-secondary">{campaign.name}</span>.
          Providers are connected at the workspace level — manage them in Settings → Connection.
        </p>
      </div>

      <div className="grid gap-4">
        {data.connections.map((conn) => (
          <ConnectionCard key={conn.key} conn={conn} onManage={goToSettings} />
        ))}
      </div>

      <p className="text-xs text-fg-muted">Connection status reflects what is stored on the backend — it is never simulated.</p>
    </Reveal>
  )
}
