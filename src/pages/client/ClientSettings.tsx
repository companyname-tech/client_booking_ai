import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'
import AgentTab from '@/components/settings/AgentTab'
import { ConnectionSettings } from '@/components/settings/ConnectionSettings'
import { TwilioTab } from '@/components/settings/TwilioTab'
import { FishVoicesTab } from '@/components/settings/FishVoicesTab'
import { TemplatesTab } from '@/components/settings/TemplatesTab'
import { ApplicationTab } from '@/components/settings/ApplicationTab'

type Section = 'agent' | 'connection' | 'twilio' | 'fish' | 'templates' | 'application'

/** Sections reachable by the `?tab=` search param (deep links from other pages). */
const SECTION_FROM_PARAM: Record<string, Section> = {
  agent: 'agent',
  connection: 'connection',
  twilio: 'twilio',
  fish: 'fish',
  templates: 'templates',
  application: 'application',
}

function AutoHangupToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="group inline-flex items-center gap-2.5 rounded-md border border-line bg-surface-1 px-3 py-2 hover:border-white/15"
    >
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors',
          on ? 'border-accent/50 bg-accent-strong' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'inline-block size-3.5 rounded-full bg-white shadow transition-transform',
            on ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </span>
      <span className="flex flex-col text-left">
        <span className="text-sm font-medium text-fg">Auto-hangup</span>
        <span className="text-2xs text-fg-muted">{on ? 'Ends calls automatically' : 'Manual hangup'}</span>
      </span>
    </button>
  )
}

export default function ClientSettings() {
  const {
    data: client,
    loading: clientLoading,
    error: clientError,
    reload: reloadClient,
  } = useAsyncData(() => repo.getCurrentClient())
  const {
    data: settings,
    loading: settingsLoading,
    error: settingsError,
    reload: reloadSettings,
  } = useAsyncData(() => repo.getSettings())
  const [searchParams] = useSearchParams()
  const [section, setSection] = useState<Section>(() => SECTION_FROM_PARAM[searchParams.get('tab') ?? ''] ?? 'agent')
  const [autoHangup, setAutoHangup] = useState(false)

  useEffect(() => {
    if (settings) setAutoHangup(settings.auto_hangup === 'true')
  }, [settings])

  const toggleAutoHangup = async () => {
    const next = !autoHangup
    setAutoHangup(next)
    void repo.saveSettings({ auto_hangup: next ? 'true' : 'false' })
  }

  if (clientLoading || settingsLoading) return <LoadingState rows={4} />
  if (clientError) return <ErrorState message={clientError} onRetry={reloadClient} />
  if (settingsError) return <ErrorState message={settingsError} onRetry={reloadSettings} />
  if (!client || !settings) return <EmptyState title="No data" />

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name={client.name} context="Client Workspace" />}
          title="Settings"
          description="Agents, connections, voices, templates and runtime configuration."
          actions={<AutoHangupToggle on={autoHangup} onToggle={toggleAutoHangup} />}
        >
          <Tabs<Section>
            aria-label="Settings sections"
            value={section}
            onChange={setSection}
            items={[
              { id: 'agent', label: 'Agent' },
              { id: 'connection', label: 'Connection' },
              { id: 'twilio', label: 'Twilio' },
              { id: 'fish', label: 'Fish voices' },
              { id: 'templates', label: 'Templates' },
              { id: 'application', label: 'Application' },
            ]}
          />
        </PageHeader>

        {section === 'agent' && <AgentTab />}
        {section === 'connection' && <ConnectionSettings client={client} />}
        {section === 'twilio' && <TwilioTab />}

        {section === 'fish' && <FishVoicesTab />}

        {section === 'templates' && <TemplatesTab />}

        {section === 'application' && <ApplicationTab />}
      </PageContainer>
    </PageTransition>
  )
}
