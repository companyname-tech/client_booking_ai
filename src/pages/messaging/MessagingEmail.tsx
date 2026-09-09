import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { GmailPreview } from '@/components/messaging/GmailPreview'
import { PlaceholderLegend } from '@/components/messaging/PlaceholderLegend'
import { useCampaignMessaging } from '@/components/messaging/useCampaignMessaging'
import type { EmailTemplate } from '@/types/settings'

const labelClass = 'mb-1.5 block text-xs font-medium text-fg-muted'

export default function MessagingEmail() {
  const {
    campaigns,
    campaignId,
    selectedCampaign,
    selectCampaign,
    settings,
    loading,
    saving,
    saved,
    error,
    templates,
    activeTemplate,
    selectedIndex,
    setSelectedIndex,
    patchEmail,
    addTemplate,
    removeTemplate,
    save,
    previewContext,
  } = useCampaignMessaging('email')

  if (loading && !templates.length) {
    return <LoadingState rows={6} />
  }

  if (error && !campaigns.length) {
    return <ErrorState message={error} />
  }

  const emailTemplate = activeTemplate as EmailTemplate | undefined

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          title="Campaign"
          description="Templates are saved per campaign. Choose a campaign to edit its email follow-ups."
        />
        <div className="mt-4 max-w-md">
          <Select
            value={campaignId}
            onChange={selectCampaign}
            options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select campaign…"
            ariaLabel="Campaign"
          />
        </div>
        {selectedCampaign && (
          <p className="mt-2 text-xs text-fg-muted">
            Editing templates for <span className="font-medium text-fg-secondary">{selectedCampaign.name}</span>
          </p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <SectionHeader
            title="Email templates"
            description="The first template is the default for this campaign."
            action={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={addTemplate}>
                  Add
                </Button>
                <Button
                  size="sm"
                  leadingIcon={saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  onClick={() => void save()}
                  disabled={saving || !campaignId}
                >
                  {saving ? 'Saving…' : saved ? 'Saved' : 'Save templates'}
                </Button>
              </div>
            }
          />

          {error && <p role="alert" className="text-sm text-danger">{error}</p>}

          {templates.length === 0 ? (
            <p className="text-sm text-fg-muted">No templates yet. Add one or they will fall back to global settings.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {templates.map((t, i) => (
                  <button
                    key={t.key || i}
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      i === selectedIndex ? 'bg-accent-soft text-accent' : 'bg-white/[0.04] text-fg-muted hover:text-fg-secondary'
                    }`}
                  >
                    {t.name || t.key || `Template ${i + 1}`}
                  </button>
                ))}
              </div>

              {emailTemplate && (
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Template name</label>
                    <Input
                      value={emailTemplate.name}
                      onChange={(e) => patchEmail(selectedIndex, { name: e.target.value })}
                      placeholder="Follow-up after call"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Key (used when sending)</label>
                    <Input
                      value={emailTemplate.key}
                      onChange={(e) => patchEmail(selectedIndex, { key: e.target.value })}
                      placeholder="default"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Subject</label>
                    <Input
                      value={emailTemplate.subject}
                      onChange={(e) => patchEmail(selectedIndex, { subject: e.target.value })}
                      placeholder="Quick follow-up — {company}"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Body</label>
                    <Textarea
                      value={emailTemplate.body}
                      onChange={(e) => patchEmail(selectedIndex, { body: e.target.value })}
                      rows={8}
                      placeholder="Hi {first_name}, …"
                    />
                  </div>
                  {templates.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      leadingIcon={<Trash2 className="size-3.5" />}
                      onClick={() => removeTemplate(selectedIndex)}
                    >
                      Remove template
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          <PlaceholderLegend />
        </Card>

        <div className="space-y-3">
          <p className="text-sm font-medium text-fg-secondary">Gmail preview</p>
          <GmailPreview
            fromName={settings?.email_from_name ?? ''}
            fromAddress={settings?.email_from_address ?? ''}
            subject={emailTemplate?.subject ?? ''}
            body={emailTemplate?.body ?? ''}
            previewContext={previewContext}
          />
        </div>
      </div>
    </div>
  )
}
