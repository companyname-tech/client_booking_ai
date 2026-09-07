/**
 * GenerateLeadsModal — the "Generate leads" action for the lead flow.
 * Two modes, one result view:
 *   • Smart Prospect Search — natural-language description → ranked prospects.
 *   • Classic generation — country + industry + count.
 * Both call the real backend (POST /leads/smart-search, POST /leads/generate)
 * via `repo` and normalize the reply with `toGenResultView`.
 */
import { useState, type ReactNode } from 'react'
import { ExternalLink, Sparkles, Target } from 'lucide-react'
import { repo } from '@/data/repository'
import { ApiError } from '@/api/adapters/http/client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { FieldLabel } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import {
  buildClassicPayload,
  buildSmartSearchPayload,
  toGenResultView,
  type GenResultView,
} from '@/lib/leadGeneration'

export interface CampaignOption {
  id: string
  name: string
}

export interface GenerateLeadsModalProps {
  open: boolean
  onClose: () => void
  /** Campaigns (backend offers) the leads can be generated into. */
  campaigns: CampaignOption[]
  /** When set (campaign-scoped lead view), the offer is fixed and the picker is hidden. */
  fixedCampaignId?: string
  /** Called after a successful run so the host can refresh its lead list. */
  onGenerated?: () => void
}

type Mode = 'smart' | 'classic'

// --- Static option data (mirrors the legacy gen modal) -----------------------

const COUNTRIES: { name: string; iso: string }[] = [
  { name: 'Israel', iso: 'IL' },
  { name: 'United States', iso: 'US' },
  { name: 'United Kingdom', iso: 'GB' },
  { name: 'Canada', iso: 'CA' },
  { name: 'Germany', iso: 'DE' },
  { name: 'France', iso: 'FR' },
  { name: 'Spain', iso: 'ES' },
  { name: 'Italy', iso: 'IT' },
  { name: 'Netherlands', iso: 'NL' },
  { name: 'Belgium', iso: 'BE' },
  { name: 'Switzerland', iso: 'CH' },
  { name: 'Austria', iso: 'AT' },
  { name: 'Sweden', iso: 'SE' },
  { name: 'Norway', iso: 'NO' },
  { name: 'Denmark', iso: 'DK' },
  { name: 'Finland', iso: 'FI' },
  { name: 'Poland', iso: 'PL' },
  { name: 'Ukraine', iso: 'UA' },
  { name: 'Romania', iso: 'RO' },
  { name: 'Greece', iso: 'GR' },
  { name: 'Portugal', iso: 'PT' },
  { name: 'Ireland', iso: 'IE' },
  { name: 'Czechia', iso: 'CZ' },
  { name: 'Hungary', iso: 'HU' },
  { name: 'Russia', iso: 'RU' },
  { name: 'Turkey', iso: 'TR' },
  { name: 'United Arab Emirates', iso: 'AE' },
  { name: 'Saudi Arabia', iso: 'SA' },
  { name: 'India', iso: 'IN' },
  { name: 'China', iso: 'CN' },
  { name: 'Japan', iso: 'JP' },
  { name: 'South Korea', iso: 'KR' },
  { name: 'Singapore', iso: 'SG' },
  { name: 'Australia', iso: 'AU' },
  { name: 'New Zealand', iso: 'NZ' },
  { name: 'South Africa', iso: 'ZA' },
  { name: 'Mexico', iso: 'MX' },
  { name: 'Brazil', iso: 'BR' },
  { name: 'Argentina', iso: 'AR' },
  { name: 'Chile', iso: 'CL' },
  { name: 'Colombia', iso: 'CO' },
  { name: 'Egypt', iso: 'EG' },
  { name: 'Morocco', iso: 'MA' },
]

const GEN_SAMPLES: { label: string; text: string }[] = [
  { label: '🏗️ Architecture firms', text: 'Israeli architecture firms with outdated websites, active on Facebook, mobile contact number' },
  { label: '🍽️ Restaurants', text: 'Restaurants in Tel Aviv that do not take online reservations and have a landline only' },
  { label: '🦷 Dentists', text: 'Dentists in Jerusalem who recently renovated their clinic and need a new website' },
]

const GEN_PLATFORMS: { value: string; label: string; disabled?: boolean; title?: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'google_business', label: 'Google Business/Maps' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'telegram', label: 'Telegram', disabled: true, title: 'Feature-flagged off' },
]

/** Human labels for coverage chips (fall back to the raw platform key). */
const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(
  GEN_PLATFORMS.map((p) => [p.value, p.label]),
)

/** Default scan = every runnable social source (matches the BE default). */
const DEFAULT_SCAN_PLATFORMS = GEN_PLATFORMS.filter((p) => !p.disabled).map((p) => p.value)

const GEN_CONTACT_TYPES: { value: string; label: string }[] = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

const GEN_RECENCY: { value: string; label: string }[] = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
  { value: '0', label: 'No limit' },
]

const GEN_DEDUP: { value: string; label: string }[] = [
  { value: 'skip', label: 'Skip duplicates (recommended)' },
  { value: 'import_anyway', label: 'Import anyway' },
]

function errorMessage(e: unknown): string {
  if (e instanceof ApiError && typeof e.body === 'object' && e.body && 'detail' in e.body) {
    return String((e.body as { detail: unknown }).detail)
  }
  if (e instanceof Error && e.message) return e.message
  return 'Generation failed'
}

export function GenerateLeadsModal({
  open,
  onClose,
  campaigns,
  fixedCampaignId,
  onGenerated,
}: GenerateLeadsModalProps) {
  const [mode, setMode] = useState<Mode>('smart')

  // Shared
  const [campaignId, setCampaignId] = useState(fixedCampaignId ?? '')
  const [dedupMode, setDedupMode] = useState('skip')

  // Smart search
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [countryIso, setCountryIso] = useState('')
  const [industry, setIndustry] = useState('')
  const [phoneType, setPhoneType] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(DEFAULT_SCAN_PLATFORMS)
  const [contactTypes, setContactTypes] = useState<string[]>(['phone'])
  const [recencyDays, setRecencyDays] = useState(90)
  const [maxResults, setMaxResults] = useState(20)

  // Classic generation
  const [classicCountry, setClassicCountry] = useState('')
  const [classicIndustry, setClassicIndustry] = useState('')
  const [classicNumber, setClassicNumber] = useState(10)

  // Run state
  const [result, setResult] = useState<GenResultView | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveCampaignId = fixedCampaignId ?? campaignId
  const canRun = !!effectiveCampaignId && !running

  function toggleValue(list: string[], v: string): string[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
  }

  async function runSmart() {
    if (!query.trim()) {
      setError('Describe the prospects you want to find.')
      return
    }
    if (!effectiveCampaignId) {
      setError('Select a campaign first.')
      return
    }
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const r = await repo.smartSearch(
        buildSmartSearchPayload({
          offerId: effectiveCampaignId,
          query,
          country,
          countryCode: countryIso,
          industry,
          phoneType,
          platforms,
          contactTypes,
          recencyDays,
          maxResults,
          dedupMode,
        }),
      )
      setResult(toGenResultView(r))
      onGenerated?.()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setRunning(false)
    }
  }

  async function runClassic() {
    if (!classicCountry.trim()) {
      setError('Country is required.')
      return
    }
    if (!classicIndustry.trim()) {
      setError('Industry is required.')
      return
    }
    if (!effectiveCampaignId) {
      setError('Select a campaign first.')
      return
    }
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const r = await repo.generateLeads(
        buildClassicPayload({
          offerId: effectiveCampaignId,
          country: classicCountry,
          phoneType,
          industry: classicIndustry,
          number: classicNumber,
          dedupMode,
        }),
      )
      setResult(toGenResultView(r))
      onGenerated?.()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Generate leads"
      description="AI-powered prospect discovery — describe who you want, or run the classic country + industry generator."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={running}>
            Close
          </Button>
          {mode === 'smart' ? (
            <Button variant="primary" leadingIcon={<Target className="size-4" />} onClick={() => void runSmart()} disabled={!canRun}>
              {running ? 'Searching…' : 'Search prospects'}
            </Button>
          ) : (
            <Button variant="primary" leadingIcon={<Sparkles className="size-4" />} onClick={() => void runClassic()} disabled={!canRun}>
              {running ? 'Generating…' : 'Generate leads'}
            </Button>
          )}
        </>
      }
    >
      <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4">
        {/* Campaign picker (hidden when the lead view is campaign-scoped). */}
        {!fixedCampaignId && (
          <div>
            <FieldLabel htmlFor="gen-campaign" required>
              Campaign
            </FieldLabel>
            <Select
              id="gen-campaign"
              value={campaignId}
              onChange={(v) => setCampaignId(v)}
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

        {/* Mode switch. */}
        <div className="flex items-center gap-1 rounded-md border border-line bg-surface-2 p-1">
          {(
            [
              { key: 'smart', label: 'Smart search', icon: <Target className="size-3.5" /> },
              { key: 'classic', label: 'Classic generation', icon: <Sparkles className="size-3.5" /> },
            ] as { key: Mode; label: string; icon: ReactNode }[]
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setMode(t.key)}
              className={cn(
                'interactive inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium',
                mode === t.key ? 'bg-surface-4 text-fg' : 'text-fg-muted hover:text-fg-secondary',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {mode === 'smart' ? (
          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="gen-query" required>
                Describe the prospects you want to find
              </FieldLabel>
              <Textarea
                id="gen-query"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Israeli architecture firms whose websites look outdated and are active on Facebook."
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GEN_SAMPLES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setQuery(s.text)}
                    className="interactive rounded-full border border-line-strong bg-surface-2 px-2.5 py-1 text-xs text-fg-secondary hover:border-white/15 hover:text-fg"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="gen-country">Country</FieldLabel>
                <Select
                  id="gen-country"
                  value={country}
                  onChange={(v) => {
                    setCountry(v)
                    setCountryIso(COUNTRIES.find((c) => c.name === v)?.iso ?? '')
                  }}
                  ariaLabel="Country"
                  placeholder="Any"
                  options={[
                    { value: '', label: 'Any' },
                    ...COUNTRIES.map((c) => ({ value: c.name, label: c.name })),
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <FieldLabel htmlFor="gen-phone">Phone type</FieldLabel>
                <Select
                  id="gen-phone"
                  value={phoneType}
                  onChange={(v) => setPhoneType(v)}
                  ariaLabel="Phone type"
                  placeholder="Any"
                  options={[
                    { value: '', label: 'Any' },
                    { value: 'mobile', label: 'Mobile' },
                    { value: 'landline', label: 'Landline' },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <FieldLabel htmlFor="gen-industry">Industry (optional)</FieldLabel>
                <Input id="gen-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Architecture" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Sources</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {GEN_PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      disabled={p.disabled}
                      title={p.title}
                      onClick={() => setPlatforms((cur) => toggleValue(cur, p.value))}
                      className={cn(
                        'interactive rounded-full border px-2.5 py-1 text-xs',
                        platforms.includes(p.value)
                          ? 'border-accent/50 bg-accent-soft text-fg'
                          : 'border-line-strong bg-surface-2 text-fg-muted hover:text-fg',
                        p.disabled && 'opacity-40',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Contact types</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {GEN_CONTACT_TYPES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setContactTypes((cur) => toggleValue(cur, c.value))}
                      className={cn(
                        'interactive rounded-full border px-2.5 py-1 text-xs',
                        contactTypes.includes(c.value)
                          ? 'border-accent/50 bg-accent-soft text-fg'
                          : 'border-line-strong bg-surface-2 text-fg-muted hover:text-fg',
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="gen-recency">Recency</FieldLabel>
                <Select
                  id="gen-recency"
                  value={String(recencyDays)}
                  onChange={(v) => setRecencyDays(Number(v) || 0)}
                  ariaLabel="Recency"
                  options={GEN_RECENCY.map((r) => ({ value: r.value, label: r.label }))}
                  className="w-full"
                />
              </div>
              <div>
                <FieldLabel htmlFor="gen-max">Max results</FieldLabel>
                <Input
                  id="gen-max"
                  type="number"
                  min={1}
                  max={50}
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value) || 20)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="gen-dedup">Duplicate handling</FieldLabel>
                <Select
                  id="gen-dedup"
                  value={dedupMode}
                  onChange={(v) => setDedupMode(v)}
                  ariaLabel="Duplicate handling"
                  options={GEN_DEDUP.map((d) => ({ value: d.value, label: d.label }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="classic-country" required>
                  Country
                </FieldLabel>
                <Select
                  id="classic-country"
                  value={classicCountry}
                  onChange={(v) => setClassicCountry(v)}
                  ariaLabel="Country"
                  placeholder="Select…"
                  options={[
                    { value: '', label: 'Select…' },
                    ...COUNTRIES.map((c) => ({ value: c.name, label: c.name })),
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <FieldLabel htmlFor="classic-industry" required>
                  Industry
                </FieldLabel>
                <Input
                  id="classic-industry"
                  value={classicIndustry}
                  onChange={(e) => setClassicIndustry(e.target.value)}
                  placeholder="e.g. Architecture"
                />
              </div>
              <div>
                <FieldLabel htmlFor="classic-number">Number of leads</FieldLabel>
                <Input
                  id="classic-number"
                  type="number"
                  min={1}
                  max={50}
                  value={classicNumber}
                  onChange={(e) => setClassicNumber(Number(e.target.value) || 10)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="classic-phone">Phone type</FieldLabel>
                <Select
                  id="classic-phone"
                  value={phoneType}
                  onChange={(v) => setPhoneType(v)}
                  ariaLabel="Phone type"
                  placeholder="Any"
                  options={[
                    { value: '', label: 'Any' },
                    { value: 'mobile', label: 'Mobile' },
                    { value: 'landline', label: 'Landline' },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <FieldLabel htmlFor="classic-dedup">Duplicate handling</FieldLabel>
                <Select
                  id="classic-dedup"
                  value={dedupMode}
                  onChange={(v) => setDedupMode(v)}
                  ariaLabel="Duplicate handling"
                  options={GEN_DEDUP.map((d) => ({ value: d.value, label: d.label }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {error && <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}

        {result && <GenResultBox result={result} />}
      </div>
    </Modal>
  )
}

function GenResultBox({ result }: { result: GenResultView }) {
  const sv = result.smart ? result.smartView : null
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-surface-2 px-3 py-2.5 text-sm text-fg-secondary">
        {sv ? (
          <>
            <span className="font-medium text-fg">Found:</span> {sv.found ?? 0}
            <span className="mx-2 text-fg-faint">|</span>
            <span className="font-medium text-fg">Imported:</span> {result.imported ?? 0}
            <span className="mx-2 text-fg-faint">|</span>
            <span className="font-medium text-fg">Updated:</span> {result.updated ?? 0}
            <span className="mx-2 text-fg-faint">|</span>
            <span className="font-medium text-fg">Skipped duplicates:</span> {result.skippedDuplicates ?? 0}
          </>
        ) : (
          <>
            <span className="font-medium text-fg">Found:</span> {result.classicFound ?? 0}
            {result.classicRequested !== undefined ? ` of ${result.classicRequested} requested` : ''}
            <span className="mx-2 text-fg-faint">|</span>
            <span className="font-medium text-fg">Imported:</span> {result.imported ?? 0}
            <span className="mx-2 text-fg-faint">|</span>
            <span className="font-medium text-fg">Updated:</span> {result.updated ?? 0}
            <span className="mx-2 text-fg-faint">|</span>
            <span className="font-medium text-fg">Skipped duplicates:</span> {result.skippedDuplicates ?? 0}
          </>
        )}
      </div>

      {sv && (
        <>
          {sv.coverage.length > 0 && (
            <div>
              <div className="label-caps mb-1.5">Source coverage</div>
              <div className="flex flex-wrap gap-1.5">
                {sv.coverage.map((c, i) => (
                  <span
                    key={i}
                    title={c.detail}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs',
                      c.status === 'searched' && 'border-success/30 bg-success-soft text-success',
                      (c.status === 'unavailable' || c.status === 'disabled') && 'border-line-strong bg-surface-2 text-fg-muted',
                      c.status !== 'searched' && c.status !== 'unavailable' && c.status !== 'disabled' && 'border-danger/30 bg-danger-soft text-danger',
                    )}
                  >
                    {PLATFORM_LABEL[c.platform] ?? c.platform}: {c.status === 'searched' ? `${c.results} results` : c.status}
                  </span>
                ))}
              </div>
              {(sv.planKeywords.length > 0 || sv.planGeography) && (
                <div className="mt-1.5 text-xs text-fg-muted">
                  Plan: {sv.planKeywords.slice(0, 8).join(', ')}
                  {sv.planGeography ? ` · ${sv.planGeography}` : ''}
                </div>
              )}
            </div>
          )}

          {sv.topLeads.length > 0 && (
            <div className="rounded-md border border-line bg-surface-2 p-3">
              <div className="label-caps mb-2">Top matches</div>
              <div className="space-y-1.5">
                {sv.topLeads.slice(0, 5).map((l, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-fg">{l.name}</span>
                    <span className="shrink-0 text-xs text-fg-muted">
                      {l.rel}% / {l.intent}%
                    </span>
                    {l.url && (
                      <a href={l.url} target="_blank" rel="noreferrer" className="shrink-0 text-fg-muted hover:text-fg">
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    {l.duplicateOf && <span className="shrink-0 text-xs text-warning">dup → {l.duplicateOf}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {result.duplicates.length > 0 && (
        <div className="rounded-md border border-line bg-surface-2 p-3">
          <div className="label-caps mb-2">Duplicates</div>
          <div className="space-y-1 text-xs">
            {result.duplicates.map((d, i) => (
              <div key={i} className="text-fg-muted">
                {d.name} → {d.matched}
                {d.reasons.length > 0 ? ` (${d.reasons.join(', ')})` : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {result.errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}
    </div>
  )
}
