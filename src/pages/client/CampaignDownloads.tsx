import { useState } from 'react'
import { Download } from 'lucide-react'
import { useCampaignContext } from './campaignContext'
import { repo } from '@/api/repository'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignDownloads() {
  const { campaign } = useCampaignContext()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (language: 'en' | 'he') => {
    setBusy(true)
    setError('')
    try {
      await repo.exportLeadsCsv(language, campaign.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Reveal>
      <div className="surface p-5">
        <h3 className="text-sm font-semibold text-fg">Leads export — {campaign.name}</h3>
        <p className="mt-1 text-xs text-fg-muted">
          Downloads this campaign&apos;s leads as a CSV file.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            leadingIcon={<Download className="size-4" />}
            onClick={() => run('en')}
            disabled={busy}
          >
            {busy ? 'Preparing…' : 'Download CSV (English)'}
          </Button>
          <Button
            variant="secondary"
            leadingIcon={<Download className="size-4" />}
            onClick={() => run('he')}
            disabled={busy}
          >
            Download CSV (Hebrew)
          </Button>
        </div>
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
      </div>
    </Reveal>
  )
}
