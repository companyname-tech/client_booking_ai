import { useState } from 'react'
import { repo } from '@/api/repository'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'

export default function ClientDownloads() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (language: 'en' | 'he') => {
    setBusy(true)
    setError('')
    try {
      await repo.exportLeadsCsv(language)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          title="Downloads"
          description="Export lead data as CSV for review and import."
        />

        <div className="surface p-5">
          <h3 className="text-sm font-semibold text-fg">Leads export</h3>
          <p className="mt-1 text-xs text-fg-muted">
            Downloads the full lead inventory (up to 10,000 rows) as a CSV.
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
      </PageContainer>
    </PageTransition>
  )
}
