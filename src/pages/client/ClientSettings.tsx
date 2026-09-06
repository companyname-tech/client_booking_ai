import { useState } from 'react'
import { repo } from '@/data/repository'
import { integrationStateMeta } from '@/lib/status'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'

type Section = 'general' | 'notifications' | 'integrations' | 'billing'

const inputClass =
  'interactive w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-fg placeholder:text-fg-faint hover:border-white/15 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25'

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
      <div>
        <div className="text-sm font-medium text-fg">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-fg-muted">{hint}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export default function ClientSettings() {
  const client = repo.getCurrentClient()
  const user = repo.getCurrentUser()
  const integrations = repo.getIntegrations()
  const [section, setSection] = useState<Section>('general')

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name={client.name} context="Client Workspace" />}
          title="Settings"
          description="Workspace, notification and connection preferences."
        >
          <Tabs<Section>
            aria-label="Settings sections"
            value={section}
            onChange={setSection}
            items={[
              { id: 'general', label: 'General' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'integrations', label: 'Integrations' },
              { id: 'billing', label: 'Billing' },
            ]}
          />
        </PageHeader>

        <Stagger key={section} className="space-y-6" stagger={0.05}>
          {section === 'general' && (
            <Reveal>
              <Card flush className="px-5">
                <div className="py-4">
                  <SectionHeader title="Workspace" description="Shown to your team and in booking emails." />
                </div>
                <div className="divide-y divide-line">
                  <Row label="Workspace name">
                    <input className={inputClass} defaultValue={client.name} />
                  </Row>
                  <Row label="Industry">
                    <input className={inputClass} defaultValue={client.industry} />
                  </Row>
                  <Row label="Owner" hint="Primary contact for approvals and billing.">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="md" />
                      <div>
                        <div className="text-sm font-medium text-fg">{user.name}</div>
                        <div className="text-xs text-fg-muted">{user.email}</div>
                      </div>
                    </div>
                  </Row>
                </div>
                <div className="flex justify-end gap-2 border-t border-line py-3">
                  <Button variant="ghost">Discard</Button>
                  <Button variant="primary">Save changes</Button>
                </div>
              </Card>
            </Reveal>
          )}

          {section === 'notifications' && (
            <Reveal>
              <Card flush className="px-5">
                <div className="py-4">
                  <SectionHeader title="Notifications" description="Choose what the AI should tell you about, and how." />
                </div>
                <div className="divide-y divide-line">
                  {[
                    ['New bookings', 'Instant email when a lead books a meeting.'],
                    ['Daily digest', 'One summary of calls, bookings and spend each morning.'],
                    ['Budget thresholds', 'Alerts at 50%, 75% and 90% of campaign budget.'],
                    ['Approval requests', 'When the team needs your decision.'],
                  ].map(([label, hint], i) => (
                    <Row key={label} label={label} hint={hint}>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg-secondary">
                        <input type="checkbox" defaultChecked={i !== 1} className="size-4 accent-[var(--color-accent)]" />
                        Enabled
                      </label>
                    </Row>
                  ))}
                </div>
              </Card>
            </Reveal>
          )}

          {section === 'integrations' && (
            <Reveal>
              <Card flush className="px-5">
                <div className="py-4">
                  <SectionHeader title="Connections" description="Tools the AI books into on your behalf." />
                </div>
                <div className="divide-y divide-line">
                  {integrations.map((i) => {
                    const meta = integrationStateMeta[i.state]
                    return (
                      <Row key={i.provider} label={i.provider[0].toUpperCase() + i.provider.slice(1)} hint={i.account ?? 'Not connected'}>
                        <div className="flex items-center justify-between gap-3">
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                          <Button size="sm" variant={i.state === 'connected' ? 'ghost' : 'secondary'}>
                            {i.state === 'connected' ? 'Manage' : 'Connect'}
                          </Button>
                        </div>
                      </Row>
                    )
                  })}
                </div>
              </Card>
            </Reveal>
          )}

          {section === 'billing' && (
            <Reveal>
              <Card flush className="px-5">
                <div className="py-4">
                  <SectionHeader title="Plan" description="Usage-based billing on top of your plan." />
                </div>
                <div className="divide-y divide-line">
                  <Row label="Current plan">
                    <span className="text-sm font-medium capitalize text-fg">{client.plan}</span>
                  </Row>
                  <Row label="Payment method" hint="Managed by your billing provider.">
                    <Button size="sm" variant="secondary">
                      Update card
                    </Button>
                  </Row>
                </div>
              </Card>
            </Reveal>
          )}
        </Stagger>
      </PageContainer>
    </PageTransition>
  )
}
