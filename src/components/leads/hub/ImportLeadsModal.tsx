/**
 * ImportLeadsModal — upload a CSV contact list into a campaign.
 * Preview via POST /leads/import/preview, import via POST /leads/import.
 */
import { useCallback, useEffect, useId, useState, type ChangeEvent, type DragEvent } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { repo } from '@/api/repository'
import { ApiError } from '@/api/adapters/http/client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldLabel } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import type { ImportPreviewResponse, LeadImportResult } from '@/types/leadGeneration'

export interface CampaignOption {
  id: string
  name: string
}

export interface ImportLeadsModalProps {
  open: boolean
  onClose: () => void
  campaigns: CampaignOption[]
  /** When set (campaign-scoped lead view), the offer is fixed and the picker is hidden. */
  fixedCampaignId?: string
  onImported?: () => void
}

const SAMPLE_CSV = `Lead Name,Website Link,Industry,Emails,Phone Numbers,Contact Name,Status
Acme Corp,https://acme.com,Technology,contact@acme.com,+972501234567,Jane Doe,New
`

const DEDUP_OPTIONS = [
  { value: 'skip', label: 'Skip duplicates' },
  { value: 'import_anyway', label: 'Import anyway' },
]

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample-leads.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportLeadsModal({
  open,
  onClose,
  campaigns,
  fixedCampaignId,
  onImported,
}: ImportLeadsModalProps) {
  const uploadId = useId()
  const [campaignId, setCampaignId] = useState(fixedCampaignId ?? '')
  const [dedupMode, setDedupMode] = useState('skip')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null)
  const [result, setResult] = useState<LeadImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  const effectiveCampaignId = fixedCampaignId ?? campaignId

  const reset = useCallback(() => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError('')
    setDragOver(false)
    setPreviewing(false)
    setImporting(false)
    setDedupMode('skip')
    setCampaignId(fixedCampaignId ?? '')
  }, [fixedCampaignId])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  useEffect(() => {
    if (fixedCampaignId) setCampaignId(fixedCampaignId)
  }, [fixedCampaignId])

  const runPreview = async (nextFile: File, offerId = effectiveCampaignId) => {
    setFile(nextFile)
    setPreview(null)
    setResult(null)
    setError('')
    setPreviewing(true)
    try {
      const p = await repo.previewLeadsImport(nextFile, offerId)
      setPreview(p)
    } catch (e) {
      setFile(null)
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  const handleFile = (next: File | null) => {
    if (!next) return
    if (!next.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file')
      return
    }
    void runPreview(next)
  }

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null
    handleFile(next)
    e.target.value = ''
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0] ?? null)
  }

  const runImport = async () => {
    if (!file) return
    setImporting(true)
    setError('')
    try {
      const r = await repo.importLeadsCsv(file, effectiveCampaignId, dedupMode)
      setResult(r)
      onImported?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const canImport = Boolean(file && preview && !previewing && !importing && !result)
  const needsCampaign = !fixedCampaignId && !effectiveCampaignId

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Upload leads"
      description="Import an existing contact list from CSV. English and Hebrew column headers are auto-detected."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={importing}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button variant="primary" onClick={() => void runImport()} disabled={!canImport || needsCampaign}>
              {importing ? 'Importing…' : 'Import leads'}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5 px-5 py-4">
        {!fixedCampaignId && (
          <div>
            <FieldLabel htmlFor="import-campaign" required>
              Campaign
            </FieldLabel>
            <Select
              id="import-campaign"
              value={campaignId}
              onChange={(v) => {
                setCampaignId(v)
                if (file) void runPreview(file, v)
              }}
              ariaLabel="Campaign"
              placeholder="Select a campaign…"
              options={[
                { value: '', label: 'Select a campaign…' },
                ...campaigns.map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="w-full"
            />
          </div>
        )}

        {!result && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                'cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition-colors',
                dragOver ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/50 hover:bg-white/[0.02]',
              )}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleInput}
                className="hidden"
                id={uploadId}
              />
              <label htmlFor={uploadId} className="block cursor-pointer">
                <Upload className="mx-auto mb-2 size-8 text-fg-muted" />
                <p className="text-sm text-fg-secondary">Drag & drop or click to upload</p>
                <p className="mt-1 text-xs text-fg-muted">
                  CSV with: Lead Name, Website Link, Industry, Emails, Phone Numbers, Contact Name, Status
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className="inline-flex h-7 items-center rounded-sm border border-line-strong bg-surface-3 px-2.5 text-xs font-medium text-fg">
                    Choose CSV
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-fg-muted"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      downloadSampleCsv()
                    }}
                  >
                    <Download className="mr-1.5 size-4" />
                    Download sample CSV
                  </Button>
                </div>
              </label>
            </div>

            <div>
              <FieldLabel htmlFor="import-dedup">Duplicate handling</FieldLabel>
              <Select
                id="import-dedup"
                value={dedupMode}
                onChange={setDedupMode}
                ariaLabel="Duplicate handling"
                options={DEDUP_OPTIONS}
                className="w-full"
              />
            </div>
          </>
        )}

        {previewing && <p className="text-sm text-fg-muted">Analyzing CSV…</p>}

        {preview && !result && (
          <div className="space-y-3 rounded-md border border-line bg-surface-2 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <FileSpreadsheet className="size-4 text-fg-muted" />
              <span className="text-sm font-medium text-fg">{preview.file_name || file?.name}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                {preview.valid_rows ?? 0} valid rows
              </span>
              {(preview.warnings ?? 0) > 0 && (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400">
                  {preview.warnings} warnings
                </span>
              )}
            </div>
            <p className="text-xs text-fg-muted">
              {preview.rows_detected ?? 0} rows detected · Language: {preview.detected_language ?? 'english'}
            </p>
            {preview.column_mapping && Object.keys(preview.column_mapping).length > 0 && (
              <details className="text-xs text-fg-muted">
                <summary className="cursor-pointer text-fg-secondary hover:text-fg">Column mapping</summary>
                <ul className="mt-2 space-y-0.5 font-mono text-2xs">
                  {Object.entries(preview.column_mapping).map(([col, field]) => (
                    <li key={col}>
                      {col} → {field}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-3 rounded-md border border-line bg-surface-2 p-4">
            <p className="text-sm font-medium text-fg">Import complete</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-emerald-400">{result.imported ?? 0} imported</span>
              {(result.updated ?? 0) > 0 && <span className="text-fg-secondary">{result.updated} updated</span>}
              {(result.skipped_duplicates ?? 0) > 0 && (
                <span className="text-amber-400">{result.skipped_duplicates} duplicates skipped</span>
              )}
            </div>
            {result.errors && result.errors.length > 0 && (
              <ul className="max-h-32 overflow-y-auto text-xs text-red-400">
                {result.errors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Modal>
  )
}
