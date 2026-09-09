import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { repo } from '@/api/repository'
import type { OfferCampaign } from '@/types'
import type { CampaignMessagingContent, MessagePreviewContext } from '@/types/messaging'
import { DEFAULT_PREVIEW_CONTEXT } from '@/types/messaging'
import type { AppSettings, EmailTemplate, MessageTemplate } from '@/types/settings'

function uniqueKey(prefix: string, taken: string[]): string {
  let key = prefix
  let n = 2
  while (taken.includes(key)) {
    key = `${prefix}_${n}`
    n += 1
  }
  return key
}

function whatsappFromSettings(settings: AppSettings | undefined): MessageTemplate[] {
  if (!settings) return []
  return (
    settings.whatsapp_templates ??
    (settings.whatsapp_message_template
      ? [{ key: 'default', name: 'Default', body: settings.whatsapp_message_template }]
      : [])
  )
}

function emailFromSettings(settings: AppSettings | undefined): EmailTemplate[] {
  if (!settings) return []
  return (
    settings.email_templates ??
    (settings.email_subject_template || settings.email_body_template
      ? [
          {
            key: 'default',
            name: 'Default',
            subject: settings.email_subject_template ?? '',
            body: settings.email_body_template ?? '',
          },
        ]
      : [])
  )
}

export function useCampaignMessaging(channel: 'whatsapp' | 'email') {
  const [searchParams, setSearchParams] = useSearchParams()
  const campaignId = searchParams.get('campaign') ?? ''

  const [campaigns, setCampaigns] = useState<OfferCampaign[]>([])
  const [settings, setSettings] = useState<AppSettings | undefined>()
  const [whatsapp, setWhatsapp] = useState<MessageTemplate[]>([])
  const [email, setEmail] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === campaignId),
    [campaigns, campaignId],
  )

  const previewContext: MessagePreviewContext = useMemo(
    () => ({
      ...DEFAULT_PREVIEW_CONTEXT,
      offer_name: selectedCampaign?.name ?? DEFAULT_PREVIEW_CONTEXT.offer_name,
    }),
    [selectedCampaign?.name],
  )

  const loadCampaignTemplates = useCallback(async (id: string) => {
    const [messaging, appSettings] = await Promise.all([
      repo.getCampaignMessaging(id),
      repo.getSettings(),
    ])
    setSettings(appSettings)
    const wa =
      messaging.whatsapp_templates?.length
        ? messaging.whatsapp_templates
        : whatsappFromSettings(appSettings)
    const em =
      messaging.email_templates?.length
        ? messaging.email_templates
        : emailFromSettings(appSettings)
    setWhatsapp(wa)
    setEmail(em)
    setSelectedIndex(0)
    setSaved(false)
    setError(null)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void repo
      .getCampaigns()
      .then((list) => {
        if (cancelled) return
        setCampaigns(list)
        if (!campaignId && list[0]?.id) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('campaign', list[0].id)
            return next
          }, { replace: true })
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load campaigns')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignId, setSearchParams])

  useEffect(() => {
    if (!campaignId) return
    let cancelled = false
    setLoading(true)
    void loadCampaignTemplates(campaignId)
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load templates')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignId, loadCampaignTemplates])

  const selectCampaign = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('campaign', id)
      return next
    })
  }

  const templates = channel === 'whatsapp' ? whatsapp : email
  const activeTemplate = templates[selectedIndex]

  const patchWhatsapp = (index: number, patch: Partial<MessageTemplate>) => {
    setWhatsapp((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)))
    setSaved(false)
  }
  const patchEmail = (index: number, patch: Partial<EmailTemplate>) => {
    setEmail((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)))
    setSaved(false)
  }

  const addTemplate = () => {
    if (channel === 'whatsapp') {
      setWhatsapp((prev) => {
        const key = uniqueKey(prev.length === 0 ? 'default' : 'template', prev.map((t) => t.key))
        return [...prev, { key, name: '', body: '' }]
      })
    } else {
      setEmail((prev) => {
        const key = uniqueKey(prev.length === 0 ? 'default' : 'template', prev.map((t) => t.key))
        return [...prev, { key, name: '', subject: '', body: '' }]
      })
    }
    setSelectedIndex(templates.length)
    setSaved(false)
  }

  const removeTemplate = (index: number) => {
    if (channel === 'whatsapp') {
      setWhatsapp((prev) => prev.filter((_, i) => i !== index))
    } else {
      setEmail((prev) => prev.filter((_, i) => i !== index))
    }
    setSelectedIndex((i) => Math.max(0, Math.min(i, templates.length - 2)))
    setSaved(false)
  }

  const save = async () => {
    if (!campaignId) return
    setSaving(true)
    setError(null)
    try {
      const payload: CampaignMessagingContent = {
        whatsapp_templates: whatsapp,
        email_templates: email,
      }
      await repo.saveCampaignMessaging(campaignId, payload)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return {
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
    patchWhatsapp,
    patchEmail,
    addTemplate,
    removeTemplate,
    save,
    previewContext,
  }
}
