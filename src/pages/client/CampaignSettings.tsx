import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Pencil } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/contexts/AuthContext'
import { canUse } from '@/lib/permissions'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Reveal } from '@/components/motion/Reveal'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  AgentSelectEditor,
  BookingEditor,
  BudgetEditor,
  LeadGenDefaultsEditor,
  TargetingEditor,
  type BookingDraft,
  type BudgetDraft,
} from '@/components/admin/CampaignSectionEditors'
import type { ReviewCampaignContent } from '@/types/admin'
import type { LeadCriteria } from '@/types'
import { normalizeBudgetWarningThresholds } from '@/lib/budgetWarnings'
import { useCampaignContext } from './campaignContext'

type SettingsSection = 'targeting' | 'budget' | 'booking' | 'leadGen' | 'agent'

function SettingsSectionCard({
  title,
  description,
  editing,
  onEdit,
  onCancel,
  children,
}: {
  title: string
  description: string
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  children: ReactNode
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader title={title} description={description} />
        {!editing && (
          <Button variant="secondary" size="sm" leadingIcon={<Pencil className="size-3.5" />} onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
      <div className="mt-4">{children}</div>
      {editing && (
        <div className="mt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Close editor
          </Button>
        </div>
      )}
    </Card>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-fg-muted">{label}</dt>
      <dd className="text-sm text-fg">{value || '—'}</dd>
    </div>
  )
}

export default function CampaignSettings() {
  const { campaign, zone, refreshCampaign } = useCampaignContext()
  const { session } = useAuth()
  const canEditAgent = zone === 'admin' && canUse(session, 'campaigns.edit')

  const [editing, setEditing] = useState<SettingsSection | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [localContent, setLocalContent] = useState<ReviewCampaignContent | null>(null)
  const [localLeadGen, setLocalLeadGen] = useState(campaign.leadGen)

  const { data, loading, error, reload } = useAsyncData(
    () => Promise.all([repo.getCampaignContent(campaign.id), repo.getAgents()]),
    [campaign.id],
  )

  const stored = localContent ?? data?.[0] ?? {}
  const agents = data?.[1] ?? []
  const assignedAgent = campaign.agentId ? agents.find((a) => a.id === campaign.agentId) : undefined
  const messagingHref =
    zone === 'admin'
      ? `/admin/messaging/email?campaign=${campaign.id}`
      : `/client/messaging/email?campaign=${campaign.id}`
  const workspaceSettingsHref = zone === 'admin' ? '/admin/settings' : '/client/settings'

  const persist = async (action: () => Promise<void>) => {
    setSaving(true)
    setToast('')
    try {
      await action()
      setEditing(null)
      setToast('Settings saved')
      void refreshCampaign()
      void reload({ silent: true })
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const mergeContent = async (patch: ReviewCampaignContent) => {
    const next = { ...stored, ...patch }
    setLocalContent(next)
    await repo.updateCampaignOffer(campaign.id, { content: next })
  }

  if (loading) return <LoadingState rows={6} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const targeting = stored.targeting ?? campaign.criteria
  const budgetSeed: BudgetDraft = {
    total: stored.budget?.total ?? campaign.budget.total,
    daily: stored.budget?.daily ?? campaign.budget.daily,
    expectedDurationDays: stored.budget?.expectedDurationDays ?? campaign.budget.expectedDurationDays,
    warningThresholds: normalizeBudgetWarningThresholds(
      stored.budget?.warningThresholds ?? campaign.budget.warningThresholds,
    ),
  }
  const bookingSeed: BookingDraft = {
    titleTemplate: stored.booking?.titleTemplate ?? '',
    email: stored.booking?.email ?? '',
  }
  const leadGen = localLeadGen ?? campaign.leadGen ?? { country: '', phoneType: 'mobile', industry: '', numberOfLeads: 10 }

  return (
    <Reveal className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-fg">Settings</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Configuration for <span className="text-fg-secondary">{campaign.name}</span>. These settings apply only to
          this campaign — workspace defaults live in Settings.
        </p>
        {toast && (
          <p role="status" aria-live="polite" className="mt-2 text-xs text-fg-secondary">
            {toast}
          </p>
        )}
      </div>

      <SettingsSectionCard
        title="Targeting"
        description="Who this campaign reaches — industries, geography, and decision-makers."
        editing={editing === 'targeting'}
        onEdit={() => setEditing('targeting')}
        onCancel={() => setEditing(null)}
      >
        {editing === 'targeting' ? (
          <TargetingEditor
            seed={targeting}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSave={(draft: Partial<LeadCriteria>) =>
              persist(() => mergeContent({ targeting: draft }))
            }
          />
        ) : (
          <dl className="space-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3">
            <FieldRow label="Industries" value={targeting.industry ?? ''} />
            <FieldRow label="Company size" value={targeting.companySize ?? ''} />
            <FieldRow label="Geography" value={targeting.location ?? ''} />
            <FieldRow label="Age range" value={targeting.ageRange ?? ''} />
            <FieldRow label="Decision-makers" value={(targeting.decisionMakers ?? []).join(', ')} />
            {targeting.other && <FieldRow label="Other criteria" value={targeting.other} />}
          </dl>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Budget"
        description="Planned spend and duration for this campaign."
        editing={editing === 'budget'}
        onEdit={() => setEditing('budget')}
        onCancel={() => setEditing(null)}
      >
        {editing === 'budget' ? (
          <BudgetEditor
            seed={budgetSeed}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSave={(draft) =>
              persist(() => mergeContent({ budget: { ...draft, currency: 'USD' } }))
            }
          />
        ) : (
          <dl className="space-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3">
            <FieldRow label="Total budget" value={budgetSeed.total ? `$${budgetSeed.total}` : ''} />
            <FieldRow label="Daily budget" value={budgetSeed.daily ? `$${budgetSeed.daily}` : ''} />
            <FieldRow
              label="Expected duration"
              value={budgetSeed.expectedDurationDays ? `${budgetSeed.expectedDurationDays} days` : ''}
            />
            <FieldRow
              label="Warning thresholds"
              value={budgetSeed.warningThresholds?.map((t) => `${t}% remaining`).join(' · ') ?? ''}
            />
          </dl>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Booking"
        description="How meetings are titled and where booking notifications are sent."
        editing={editing === 'booking'}
        onEdit={() => setEditing('booking')}
        onCancel={() => setEditing(null)}
      >
        {editing === 'booking' ? (
          <BookingEditor
            seed={bookingSeed}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSave={(draft) => persist(() => mergeContent({ booking: draft }))}
          />
        ) : (
          <dl className="space-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3">
            <FieldRow label="Title template" value={bookingSeed.titleTemplate} />
            <FieldRow label="Booking email" value={bookingSeed.email} />
          </dl>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Lead generation defaults"
        description="Pre-fills the Generate leads form when working in this campaign."
        editing={editing === 'leadGen'}
        onEdit={() => setEditing('leadGen')}
        onCancel={() => setEditing(null)}
      >
        {editing === 'leadGen' ? (
          <LeadGenDefaultsEditor
            seed={leadGen}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSave={(draft) =>
              persist(async () => {
                const next = await repo.updateCampaignLeadGen(campaign.id, draft)
                setLocalLeadGen(next.leadGen)
              })
            }
          />
        ) : (
          <dl className="space-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3">
            <FieldRow label="Country" value={leadGen.country} />
            <FieldRow label="Phone type" value={leadGen.phoneType || 'Any'} />
            <FieldRow label="Industry" value={leadGen.industry} />
            <FieldRow label="Lead count" value={String(leadGen.numberOfLeads)} />
          </dl>
        )}
      </SettingsSectionCard>

      {canEditAgent && (
        <SettingsSectionCard
          title="Assigned agent"
          description="The AI agent that runs calls for this campaign."
          editing={editing === 'agent'}
          onEdit={() => setEditing('agent')}
          onCancel={() => setEditing(null)}
        >
          {editing === 'agent' ? (
            <AgentSelectEditor
              agents={agents}
              seedAgentId={campaign.agentId}
              saving={saving}
              onCancel={() => setEditing(null)}
              onSave={(agentId) =>
                persist(async () => {
                  await repo.updateCampaignOffer(campaign.id, { agentId })
                })
              }
            />
          ) : assignedAgent ? (
            <dl className="space-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3">
              <FieldRow label="Agent" value={assignedAgent.name} />
              <FieldRow label="Voice" value={assignedAgent.voice || 'default'} />
              <FieldRow label="Language" value={assignedAgent.language || 'default'} />
            </dl>
          ) : (
            <p className="text-sm text-fg-muted">No agent assigned yet.</p>
          )}
        </SettingsSectionCard>
      )}

      <Card className="p-5 sm:p-6">
        <SectionHeader
          title="Messaging templates"
          description="Email and WhatsApp templates scoped to this campaign. Overrides workspace defaults when set."
          action={
            <Link
              to={messagingHref}
              className="interactive ring-focus inline-flex h-7 items-center gap-1.5 rounded-sm border border-line-strong bg-surface-3 px-2.5 text-xs font-medium text-fg hover:bg-surface-4"
            >
              Edit templates <ExternalLink className="size-3.5" />
            </Link>
          }
        />
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader
          title="Workspace connections"
          description="Twilio, email, and model providers are connected at the workspace level and shared across campaigns."
          action={
            <Link
              to={workspaceSettingsHref}
              className="interactive ring-focus inline-flex h-7 items-center gap-1.5 rounded-sm border border-line-strong bg-surface-3 px-2.5 text-xs font-medium text-fg hover:bg-surface-4"
            >
              Open workspace settings <ExternalLink className="size-3.5" />
            </Link>
          }
        />
      </Card>
    </Reveal>
  )
}
