import { useEffect, useState } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import AgentTab from '@/components/settings/AgentTab'
import { ConnectionSettings } from '@/components/settings/ConnectionSettings'
import { AgentTelegramConnections } from '@/components/settings/AgentTelegramConnections'
import { TwilioTab } from '@/components/settings/TwilioTab'
import { LeadSourcesAndEnrichment } from '@/components/settings/LeadSourcesAndEnrichment'
import { FishVoicesTab } from '@/components/settings/FishVoicesTab'
import { TemplatesTab } from '@/components/settings/TemplatesTab'
import { ApplicationTab } from '@/components/settings/ApplicationTab'
import { AutoHangupToggle } from '@/components/settings/AutoHangupToggle'

type Section = 'agent' | 'connection' | 'twilio' | 'fish' | 'templates' | 'leadsources' | 'application'

export default function AdminSettings() {
  const {
    data: settings,
    loading: settingsLoading,
    error: settingsError,
    reload: reloadSettings,
  } = useAsyncData(() => repo.getSettings())
  const [section, setSection] = useState<Section>('agent')
  const [autoHangup, setAutoHangup] = useState(false)

  useEffect(() => {
    if (settings) setAutoHangup(settings.auto_hangup === 'true')
  }, [settings])

  const toggleAutoHangup = async () => {
    const next = !autoHangup
    setAutoHangup(next)
    void repo.saveSettings({ auto_hangup: next ? 'true' : 'false' })
  }

  if (settingsLoading) return <LoadingState rows={4} />
  if (settingsError) return <ErrorState message={settingsError} onRetry={reloadSettings} />
  if (!settings) return <EmptyState title="No data" />

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Internal Console" />}
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
              { id: 'leadsources', label: 'Lead sources' },
              { id: 'application', label: 'Application' },
            ]}
          />
        </PageHeader>

        {section === 'agent' && <AgentTab />}
        {section === 'connection' && (
          <div className="space-y-6">
            <ConnectionSettings />
            <AgentTelegramConnections />
          </div>
        )}
        {section === 'twilio' && <TwilioTab />}
        {section === 'fish' && <FishVoicesTab />}
        {section === 'templates' && <TemplatesTab />}
        {section === 'leadsources' && <LeadSourcesAndEnrichment />}
        {section === 'application' && <ApplicationTab />}
      </PageContainer>
    </PageTransition>
  )
}
