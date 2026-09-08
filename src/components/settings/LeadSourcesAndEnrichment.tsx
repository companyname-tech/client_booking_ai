import { useState } from 'react'
import { KeyRound, RefreshCw } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, SectionHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SecretInput } from './SecretInput'
import type {
  IntegrationHealthRecord,
  IntegrationProviderPatch,
  IntegrationProviderRow,
} from '@/types/leadSources'

/**
 * Settings → Lead sources — "Lead Sources & Enrichment".
 *
 * Every provider row is driven by REAL backend state (T14):
 *   - GET /integrations/providers → masked config row (label/section/enabled/
 *     base_url/configured — keys are NEVER returned, only the `configured`
 *     boolean).
 *   - GET /integrations/health    → 9-field probe record per provider
 *     (configured, reachable, authorized, healthy, last_success,
 *     last_failure, latency_ms). Tri-state `null` = never probed / job tool
 *     with no listening endpoint → rendered "Not checked", never "Connected".
 *
 * The "Test" buttons re-run the backend's REAL per-provider probe (a plain
 * re-GET of /integrations/health?provider=…). Nothing here is simulated.
 */

type EditKind = 'key' | 'base_url' | 'enabled'

/** FE-only UI metadata for the D8 catalog tokens. Labels/sections/states come
 * from the backend rows; this map only decides what a row can be configured
 * with and what its probe does (static documentation, not health state). */
const PROVIDER_EDIT: Record<string, { kind: EditKind; description: string }> = {
  google_places: {
    kind: 'key',
    description:
      'Official Google Places API (New). A live check sends one searchText probe with the API key in a header — never in the URL.',
  },
  google_maps: {
    kind: 'base_url',
    description:
      'Self-hosted Google Maps scraper (gosom). A live check GETs {base_url}/api/docs.',
  },
  katana: {
    kind: 'enabled',
    description:
      'ProjectDiscovery Katana — URL discovery inside the pipeline. Job container with no listening port: its verdict stays "Not checked" until a real run reports.',
  },
  crawlee: {
    kind: 'enabled',
    description:
      'Crawlee — website extraction inside the pipeline. Job container with no listening port: its verdict stays "Not checked" until a real run reports.',
  },
  phoneinfoga: {
    kind: 'base_url',
    description: 'Self-hosted PhoneInfoga daemon. A live check GETs {base_url}/.',
  },
  theharvester: {
    kind: 'enabled',
    description:
      'theHarvester — domain/email discovery inside the pipeline. Job container with no listening port: its verdict stays "Not checked" until a real run reports.',
  },
  maigret: {
    kind: 'enabled',
    description:
      'Maigret — social-profile discovery inside the pipeline. Job container with no listening port: its verdict stays "Not checked" until a real run reports.',
  },
  spiderfoot: {
    kind: 'base_url',
    description: 'Self-hosted SpiderFoot daemon (deep OSINT). A live check GETs {base_url}/.',
  },
}

const DEFAULT_PROVIDER_EDIT: { kind: EditKind; description: string } = {
  kind: 'enabled',
  description: '',
}

interface SectionDef {
  id: string
  eyebrow: string
  title: string
  description: string
  /** D8 tokens rendered in this card, in display order. */
  tokens: string[]
}

const SECTIONS: SectionDef[] = [
  {
    id: 'discovery',
    eyebrow: 'Discovery',
    title: 'Discovery',
    description:
      'Sources that find new businesses to contact. Web search also runs as a discovery channel, but inside each campaign search through the AI model — it keeps no standing connection, so there is nothing to configure or probe here.',
    tokens: ['google_places', 'google_maps'],
  },
  {
    id: 'social',
    eyebrow: 'Social discovery',
    title: 'Social Discovery',
    description:
      'Facebook, Instagram, Reddit, LinkedIn and X are scanned on demand during smart searches — public pages via site-restricted web search (Reddit uses its public JSON API). They keep no standing credentials, so the backend reports no connection or health state for them; per-platform availability is reported per search in the campaign result coverage.',
    tokens: [],
  },
  {
    id: 'enrichment',
    eyebrow: 'Enrichment',
    title: 'Enrichment',
    description:
      'Tools that improve already-identified leads. Katana, Crawlee, theHarvester and Maigret run as job containers inside the pipeline — no open port, so they honestly show "Not checked" until a run reports. PhoneInfoga and SpiderFoot are self-hosted daemons with live probes.',
    tokens: ['katana', 'crawlee', 'phoneinfoga', 'theharvester', 'maigret', 'spiderfoot'],
  },
]

const SOCIAL_CHANNELS = ['Facebook', 'Instagram', 'Reddit', 'LinkedIn', 'X (Twitter)']

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'Something went wrong'
}

/** ISO-8601 UTC → short local timestamp; null/empty → "—". */
function formatTs(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

interface ChipState {
  tone: 'success' | 'danger' | 'neutral'
  label: string
}

function triChip(value: boolean | null | undefined, ok: string, bad: string): ChipState {
  if (value === true) return { tone: 'success', label: ok }
  if (value === false) return { tone: 'danger', label: bad }
  return { tone: 'neutral', label: 'Not checked' }
}

type HealthMap = Record<string, IntegrationHealthRecord>
type RowMap = Record<string, IntegrationProviderRow>

function ProviderRow({
  token,
  row,
  health,
  healthLoading,
  testing,
  onTest,
  onConfigure,
}: {
  token: string
  row: IntegrationProviderRow
  health: IntegrationHealthRecord | null
  healthLoading: boolean
  testing: boolean
  onTest: () => void
  onConfigure: () => void
}) {
  const meta = PROVIDER_EDIT[token] ?? DEFAULT_PROVIDER_EDIT
  const reachable = triChip(health?.reachable, 'Reachable', 'Unreachable')
  const authorized = triChip(health?.authorized, 'Authorized', 'Denied')
  const healthy = triChip(health?.healthy, 'Healthy', 'Unhealthy')

  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-fg">{row.label}</span>
          {row.paid && (
            <span className="rounded-full border border-line-strong bg-surface-2 px-1.5 text-2xs text-fg-muted">
              Paid
            </span>
          )}
          <StatusBadge tone={row.configured ? 'success' : 'neutral'}>
            {row.configured ? 'Configured' : 'Not configured'}
          </StatusBadge>
          {meta.kind === 'key' && row.configured && (
            <span className="inline-flex items-center gap-1 text-2xs text-fg-muted">
              <KeyRound className="size-3" />
              Key set (masked)
            </span>
          )}
        </div>
        {meta.description && (
          <p className="text-xs leading-relaxed text-fg-muted">{meta.description}</p>
        )}
        {row.base_url && meta.kind === 'base_url' && (
          <p className="truncate font-mono text-2xs text-fg-faint">{row.base_url}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {healthLoading && !health ? (
            <span className="inline-flex items-center gap-1.5 text-2xs text-fg-muted">
              <RefreshCw className="size-3 animate-spin" /> Checking…
            </span>
          ) : (
            <>
              <StatusBadge tone={reachable.tone} title="Most recent probe reached the endpoint">
                {reachable.label}
              </StatusBadge>
              <StatusBadge tone={authorized.tone} title="Probe verdict: 2xx authorized, 401/403 denied">
                {authorized.label}
              </StatusBadge>
              <StatusBadge
                tone={healthy.tone}
                title="Healthy only when configured AND reachable AND authorized are all true"
              >
                {healthy.label}
              </StatusBadge>
              {typeof health?.latency_ms === 'number' && (
                <span className="text-2xs tabular text-fg-muted">{health.latency_ms} ms</span>
              )}
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-2xs text-fg-muted">
          <span>
            Last success: <span className="tabular text-fg-faint">{formatTs(health?.last_success)}</span>
          </span>
          <span>
            Last failure: <span className="tabular text-fg-faint">{formatTs(health?.last_failure)}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:justify-start">
        <Button size="sm" variant="secondary" onClick={onTest} disabled={testing || healthLoading}>
          <RefreshCw className={testing ? 'size-3 animate-spin' : 'size-3'} />
          {testing ? 'Testing…' : 'Test connection'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onConfigure}>
          Configure
        </Button>
      </div>
    </div>
  )
}

/**
 * Lead Sources & Enrichment settings page (replaces the former Social media
 * tab). Owns only the D8 integration catalog rows; legacy per-agent Telegram
 * connections moved to the Connection tab.
 */
export function LeadSourcesAndEnrichment() {
  const providersQ = useAsyncData(() => repo.getIntegrationProviders())
  const healthQ = useAsyncData(() => repo.getIntegrationHealth())

  const [rows, setRows] = useState<RowMap>({})
  const [health, setHealth] = useState<HealthMap>({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editor, setEditor] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { enabled: boolean; base_url: string; key: string }>>({})
  const [saving, setSaving] = useState(false)

  const providerList = providersQ.data ?? []
  const rowByToken: RowMap = { ...Object.fromEntries(providerList.map((r) => [r.provider, r])), ...rows }
  const healthByToken: HealthMap = { ...Object.fromEntries((healthQ.data ?? []).map((h) => [h.provider, h])), ...health }

  async function testProvider(token: string) {
    setTesting((t) => ({ ...t, [token]: true }))
    setErrors((e) => ({ ...e, [token]: '' }))
    try {
      const records = await repo.getIntegrationHealth(token)
      const record = records.find((r) => r.provider === token)
      if (record) setHealth((h) => ({ ...h, [token]: record }))
    } catch (err) {
      setErrors((e) => ({ ...e, [token]: errorMessage(err) }))
    } finally {
      setTesting((t) => ({ ...t, [token]: false }))
    }
  }

  function openEditor(token: string) {
    const row = rowByToken[token]
    if (!row) return
    setDrafts((d) => ({ ...d, [token]: { enabled: row.enabled, base_url: row.base_url ?? '', key: '' } }))
    setEditor(token)
  }

  async function saveProvider(token: string) {
    const draft = drafts[token]
    if (!draft) return
    setSaving(true)
    setErrors((e) => ({ ...e, [token]: '' }))
    try {
      const meta = PROVIDER_EDIT[token] ?? DEFAULT_PROVIDER_EDIT
      const patch: IntegrationProviderPatch = { enabled: draft.enabled }
      if (meta.kind === 'base_url') patch.base_url = draft.base_url.trim()
      if (meta.kind === 'key' && draft.key.trim()) patch.key = draft.key.trim()
      const updated = await repo.updateIntegrationProvider(token, patch)
      setRows((r) => ({ ...r, [token]: updated }))
      // Re-probe right after a config write so the shown state reflects it.
      const records = await repo.getIntegrationHealth(token)
      const record = records.find((x) => x.provider === token)
      if (record) setHealth((h) => ({ ...h, [token]: record }))
      setEditor(null)
    } catch (err) {
      setErrors((e) => ({ ...e, [token]: errorMessage(err) }))
    } finally {
      setSaving(false)
    }
  }

  async function clearKey(token: string) {
    setSaving(true)
    setErrors((e) => ({ ...e, [token]: '' }))
    try {
      const updated = await repo.updateIntegrationProvider(token, { key: '' })
      setRows((r) => ({ ...r, [token]: updated }))
      const records = await repo.getIntegrationHealth(token)
      const record = records.find((x) => x.provider === token)
      if (record) setHealth((h) => ({ ...h, [token]: record }))
      setDrafts((d) => ({ ...d, [token]: { ...(d[token] ?? { enabled: updated.enabled, base_url: '', key: '' }), key: '' } }))
    } catch (err) {
      setErrors((e) => ({ ...e, [token]: errorMessage(err) }))
    } finally {
      setSaving(false)
    }
  }

  if (providersQ.loading) return <LoadingState rows={5} />
  if (providersQ.error) return <ErrorState message={providersQ.error} onRetry={providersQ.reload} />
  if (!providersQ.data || providerList.length === 0) {
    return (
      <EmptyState
        title="No lead source providers"
        description="The backend returned no provider configuration. If this is a fresh environment, start the backend from the OSINT wave so /integrations/providers responds."
        action={
          <Button size="sm" variant="secondary" onClick={providersQ.reload}>
            Retry
          </Button>
        }
      />
    )
  }

  const openDraft = editor ? drafts[editor] : null
  const openRow = editor ? rowByToken[editor] : undefined
  const openMeta = editor ? PROVIDER_EDIT[editor] ?? DEFAULT_PROVIDER_EDIT : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          Real, per-probe status of the lead-generation providers. Keys are stored server-side and
          never returned — the page only ever sees <span className="font-mono text-fg-secondary">configured</span>.
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={healthQ.reload}
          disabled={healthQ.loading}
          leadingIcon={<RefreshCw className={healthQ.loading ? 'animate-spin' : ''} />}
        >
          {healthQ.loading ? 'Checking…' : 'Run all checks'}
        </Button>
      </div>

      {healthQ.error && (
        <div className="rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
          Health check unavailable: {healthQ.error}
        </div>
      )}

      {SECTIONS.map((section) => {
        const sectionRows = section.tokens
          .map((token) => rowByToken[token])
          .filter((row): row is IntegrationProviderRow => Boolean(row))
        return (
          <Card key={section.id} flush className="px-5">
            <div className="py-4">
              <SectionHeader
                eyebrow={section.eyebrow}
                title={section.title}
                description={section.description}
              />
            </div>

            {section.id === 'social' ? (
              <div className="border-t border-line">
                <div className="flex flex-wrap items-center gap-1.5 py-4">
                  {SOCIAL_CHANNELS.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-line-strong bg-surface-2 px-2.5 py-1 text-xs text-fg-secondary"
                    >
                      {name}
                    </span>
                  ))}
                  <span className="px-1 text-2xs text-fg-muted">
                    scanned on demand — no standing connection or health state
                  </span>
                </div>
              </div>
            ) : null}

            {section.id !== 'social' && (
              <div className="divide-y divide-line">
                {sectionRows.length === 0 ? (
                  <div className="py-4 text-sm text-fg-muted">
                    No providers reported by the backend for this section.
                  </div>
                ) : (
                  sectionRows.map((row) => {
                    const token = row.provider
                    return (
                      <div key={token}>
                        <ProviderRow
                          token={token}
                          row={row}
                          health={healthByToken[token] ?? null}
                          healthLoading={healthQ.loading && !healthByToken[token]}
                          testing={Boolean(testing[token])}
                          onTest={() => void testProvider(token)}
                          onConfigure={() => openEditor(token)}
                        />
                        {editor === token && openDraft && openRow && openMeta && (
                          <div className="grid gap-3 border-t border-line py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
                            <div className="min-w-0 space-y-3">
                              <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-secondary">
                                <input
                                  type="checkbox"
                                  checked={openDraft.enabled}
                                  onChange={(e) =>
                                    setDrafts((d) => ({
                                      ...d,
                                      [token]: { ...d[token], enabled: e.target.checked },
                                    }))
                                  }
                                  className="size-4 accent-[var(--color-accent)]"
                                />
                                Enabled
                              </label>
                              {openMeta.kind === 'base_url' && (
                                <div>
                                  <div className="mb-1 text-xs text-fg-muted">Base URL</div>
                                  <Input
                                    value={openDraft.base_url}
                                    onChange={(e) =>
                                      setDrafts((d) => ({
                                        ...d,
                                        [token]: { ...d[token], base_url: e.target.value },
                                      }))
                                    }
                                    placeholder="http://127.0.0.1:8100"
                                    autoComplete="off"
                                  />
                                </div>
                              )}
                              {openMeta.kind === 'key' && (
                                <div>
                                  <div className="mb-1 text-xs text-fg-muted">Google Places API key</div>
                                  <SecretInput
                                    value={openDraft.key}
                                    onChange={(e) =>
                                      setDrafts((d) => ({
                                        ...d,
                                        [token]: { ...d[token], key: e.target.value },
                                      }))
                                    }
                                    placeholder={
                                      openRow.configured
                                        ? 'Leave blank to keep the stored key'
                                        : 'Paste the Places API key'
                                    }
                                  />
                                  {openRow.configured && (
                                    <button
                                      type="button"
                                      onClick={() => void clearKey(token)}
                                      disabled={saving}
                                      className="mt-1.5 text-xs text-fg-muted underline-offset-2 hover:text-danger hover:underline"
                                    >
                                      Remove stored key
                                    </button>
                                  )}
                                </div>
                              )}
                              {errors[token] && (
                                <p className="text-xs text-danger">{errors[token]}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 sm:items-start">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => void saveProvider(token)}
                                disabled={saving}
                              >
                                {saving ? 'Saving…' : 'Save'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditor(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

