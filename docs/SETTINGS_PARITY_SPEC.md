# ClientSettings parity spec — legacy `#settings-view` → `client_booking_ai`

> **SUPERSEDED — historical spec.** Settings parity and mock-data removal are
> complete. The app is now wired to the real leads_to_conversion backend (the
> `src/api/adapters/mock/` directory was removed and `VITE_USE_MOCK_DATA` is no
> longer read). Any reference to `mock/*`, `VITE_USE_MOCK_DATA`, or `todo()`
> stubs below describes the pre-wiring plan, not current behavior. For the
> current data flow and endpoint map, see `docs/ARCHITECTURE.md` and
> `docs/API_CONTRACT.md`.

Status: SPEC ONLY — no implementation in this task.
Source of truth for legacy: `leads_to_conversion_fe` (vanilla SPA) `index.html#settings-view` +
`js/app/settings.js` + `js/app/connections.js`, backed by `leads_to_conversion/backend`.
Target: `client_booking_ai` (React 19 + Vite + TS), `src/pages/client/ClientSettings.tsx`.

> **Scope guard.** `leads_to_conversion_fe` also contains a *second* React SPA at
> `leads_to_conversion_fe/src/Screens/` (`src/Screens/SettingsScreen/settings_screen.tsx`,
> `src/Screens/VoiceConsoleScreen/...`). That is a DIFFERENT codebase and is OUT OF SCOPE.
> The reference for parity is the **vanilla** `index.html#settings-view` only, and the
> implementation target is **`client_booking_ai`** (paths `src/pages/`, `src/components/`,
> `src/api/`, `src/types/`, `src/app/`). Do not port `src/Screens/*` patterns.

---

## 1. CURRENT STATE

### 1.1 New FE today (`client_booking_ai`)

`src/pages/client/ClientSettings.tsx` is a **workspace-preferences page**, not a parity of the
legacy Settings screen. Four tabs — `general` / `notifications` / `integrations` / `billing`:

| New tab | Contents | Data source |
|---|---|---|
| general | Workspace name, industry, owner (read-only avatar) | `repo.getCurrentClient()`, `repo.getCurrentUser()` |
| notifications | 4 hardcoded checkboxes | none (hardcoded) |
| integrations | `repo.getIntegrations()` → gmail/calendly/zoom + `integrationStateMeta` | `Integration` type (OAuth SaaS connections) |
| billing | plan (read-only), "Update card" button (no-op) | `client.plan` |

Route: `/client/settings` (`src/app/routes/client.routes.tsx:102`). `/client/integrations`
redirects here (line 96). `ClientSettings` imports `repo` from `@/data/repository` (deprecated
re-export of `@/api/repository`).

Existing `Agent` type (`src/types/index.ts:271`) has: `id, name, voice, language, status,
offerCampaignIds, callsToday, successRate, trainingProgress`. It has **none** of the legacy
agent-editing fields (`identity`, `role`, `role_label`, `audio_model`, `transcription_model`,
`agent_model`, `effective_identity`).

Existing `Integration` type (`src/types/index.ts:283`) is `provider: 'gmail'|'calendly'|'zoom'` +
`state` — a **different concept** from the legacy Connections (token-backed provider credentials).

### 1.2 Legacy FE (`leads_to_conversion_fe` `#settings-view`)

Five upper tabs (`.settings-tabs` / `switchSettingsTab`) + a top-level auto-hangup toggle +
a bottom "Save Settings" button:

1. **Agent** (`tab-agent`, default) — collapsible agent cards + "Caller identity" card.
2. **Connection** (`tab-connection`) — provider connections CRUD + Twilio numbers CRUD +
   WhatsApp sender + Email sender + TTS provider.
3. **Fish voices** (`tab-fish`) — named Fish Audio voice registry.
4. **Templates** (`tab-templates`) — WhatsApp + Email message templates.
5. **Application** (`tab-runtime`) — **schema-driven** runtime settings form.

`SETTINGS_FIELDS` (saved by the single `btn-settings-save`, persisted via `PUT /settings`):

| DOM id | Key | Tab |
|---|---|---|
| `s-wa-phone` | `whatsapp_from_phone` | Connection (WhatsApp sender) |
| `s-wa-template` | `whatsapp_message_template` | Templates |
| `s-email-addr` | `email_from_address` | Connection (Email sender) |
| `s-email-name` | `email_from_name` | Connection (Email sender) |
| `s-email-subject` | `email_subject_template` | Templates |
| `s-email-body` | `email_body_template` | Templates |
| `s-caller-name` | `caller_display_name` | Agent (Caller identity) |
| `s-caller-company` | `caller_company_name` | Agent (Caller identity) |
| `s-tts-provider` | `tts_provider` (`openai`\|`fish`) | Connection (Voice/TTS) |
| `s-auto-hangup` | `auto_hangup` (`"true"`\|`"false"`) | header toggle, saves on change |

---

## 2. TARGET STATE

Replace the current ClientSettings page with a parity of the legacy Settings screen, expressed
in the new FE's idioms (Tabs component, `Card`/`SectionHeader`, `Row`, `Field`/`Input`,
`StatusBadge`, eye-toggle pattern for secrets). **Do not** reproduce the legacy vanilla DOM;
map each legacy element to a new component + type + repository method.

Proposed tab model (matches legacy exactly, preserves the user's "Settings holds CONNECTION
settings; templates stay in their own tab" rule):

| New tab id | Legacy tab | Responsibility |
|---|---|---|
| `agent` | Agent | agent cards (voice/language/audio/transcript/identity) + caller identity |
| `connection` | Connection | provider connections + Twilio numbers + WhatsApp/Email sender + TTS provider |
| `fish` | Fish voices | Fish Audio named-voice registry |
| `templates` | Templates | WhatsApp + Email templates |
| `application` | Application | schema-driven runtime settings |

Auto-hangup toggle stays pinned in the page header (immediate save), matching legacy behavior.

---

## 3. COMPONENTS AFFECTED

New FE files (implementation tasks — NOT done here):

- `src/pages/client/ClientSettings.tsx` — rewrite to 5-tab parity layout.
- `src/types/index.ts` (or new `src/types/settings.ts`) — add types below.
- `src/api/contracts/index.ts` — `Repository` picks up new methods via `MockRepository`.
- `src/api/adapters/mock/repository.ts` + new mock modules — mock data parity.
- `src/api/adapters/http/repository.ts` — wire HTTP methods.
- `src/lib/status.ts` — `connectionKindMeta`/`connectionStateMeta` if badge styling is needed.
- Possibly `src/components/settings/*` — one file per legacy card (agents list, connection
  row, twilio numbers, fish voices, templates, application schema form) to avoid a fat page.

---

## 4. OWNERSHIP

- The Settings **page** owns all five tabs; it composes sub-components, holds no business logic.
- `repo` (`src/api/repository.ts`) is the sole data facade — pages/components never touch
  `mock/*` or `http/*` directly (AGENTS.md rule 1).
- Each persistent record has one owner endpoint on the legacy backend (mirrored in types):
  - settings → `GET/PUT /settings`, `GET /settings/schema`
  - connections → `GET/PUT /connections`, `DELETE /connections/{key}`
  - twilio numbers → `GET/POST /twilio-numbers`, `PUT/DELETE /twilio-numbers/{id}`
  - fish voices → `GET/POST /fish-voices`, `DELETE /fish-voices/{reference_id}`
  - agents → `GET/POST /agents`, `GET/PUT/DELETE /agents/{agent_id}` (also `GET /agents/voices`, `GET /agents/models`)

---

## 5. DATA FLOW

```
ClientSettings.tsx
  └─ repo (Repository interface)
       ├─ mock: src/api/adapters/mock/repository.ts  (env.VITE_USE_MOCK_DATA=true, default)
       └─ http: src/api/adapters/http/repository.ts  (env.VITE_USE_MOCK_DATA=false)
```

Legacy backend endpoints (already live on `leads_to_conversion` BE; the new http adapter must
call them — the FE `server.js` proxy is NOT used by `client_booking_ai`, which talks to
`env.apiBaseUrl` = `/api`):

- `GET /settings` → app_settings (templates/caller/tts/auto_hangup) + computed flags.
- `PUT /settings` → partial update (runtime fields → `runtime` doc; DEFAULT_APP_SETTINGS keys → `app_settings` doc; twilio sid/token → `credentials` doc).
- `GET /settings/schema` → `{ fields: [{name,label,type,secret,restart_required}] }`.
- `GET/PUT /connections`, `DELETE /connections/{key}` → provider tokens (secrets masked on read).
- `GET/POST /twilio-numbers`, `PUT/DELETE /twilio-numbers/{id}` → sender-number registry.
- `GET/POST /fish-voices`, `DELETE /fish-voices/{reference_id}` → named Fish voices.
- `GET/POST /agents`, `GET/PUT/DELETE /agents/{agent_id}` → agent records.

---

## 6. API CONTRACTS (types to add)

### 6.1 `AppSettings` (mirrors `DEFAULT_APP_SETTINGS` + resolved flags)

```ts
interface AppSettings {
  whatsapp_from_phone: string
  whatsapp_message_template: string
  email_from_address: string
  email_from_name: string
  email_subject_template: string
  email_body_template: string
  caller_display_name: string
  caller_company_name: string
  auto_hangup: 'true' | 'false'
  tts_provider: 'openai' | 'fish'
  // computed flags returned by GET /settings:
  whatsapp_configured: boolean
  email_configured: boolean
  email_provider: 'smtp' | 'twilio'
  google_meet_configured: boolean
  google_meet_host_email: string
  integrations_live: boolean
  tts_openai_configured: boolean
  tts_fish_configured: boolean
  twilio_configured: boolean
}
```

### 6.2 `ProviderConnection` + `EmailConnection`

```ts
type ConnectionKind = 'model' | 'channel' | 'meeting'
type ConnectionKey = 'openai' | 'fish' | 'deepseek' | 'twilio' | 'email' | 'google_meet'

interface ProviderConnection {
  key: ConnectionKey
  label: string          // e.g. "ChatGPT (OpenAI)"
  kind: ConnectionKind
  description: string
  configured: boolean
  masked?: string        // masked token preview, never the raw secret
  provider?: 'smtp' | 'twilio'   // email only
  host_email?: string    // google_meet only
}

interface EmailConnection {
  provider: 'smtp' | 'twilio'
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_use_tls: string   // "true" | "false"
  configured: boolean
  masked_password: string
  masked_sendgrid_key: string
}

interface ConnectionsState {
  connections: ProviderConnection[]
  email: EmailConnection
}
```

### 6.3 `TwilioNumber` and `FishVoice`

```ts
interface TwilioNumber { id: string; label: string; phone: string; voice: boolean; whatsapp: boolean }
interface FishVoice { name: string; reference_id: string }
```

### 6.4 `SettingsSchemaField` (Application tab)

```ts
interface SettingsSchemaField {
  name: string
  label: string
  type: 'string' | 'integer' | 'number' | 'boolean'
  secret: boolean
  restart_required: boolean
}
```

### 6.5 Extend `Agent` (keep existing fields; add legacy editing fields)

```ts
// add to Agent in src/types/index.ts:
role: string                // AGENT_ROLES key
role_label: string          // computed label
identity: string            // custom identity; "" = use role template
effective_identity: string
audio_model: string         // TTS model ("" = default)
transcription_model: string // caller STT model ("" = default)
agent_model: string         // chat-completions "brain" model
```

Roles enum (from `AGENT_ROLES` / `ROLE_ORDER`): `cold_call_seller`, `appointment_setter`,
`sales_follow_up`, `customer_support`, `custom`.

**Note on the existing `Agent` vs `AIAgentProfile` split.** The new FE already has a separate
`/client/ai/agents` zone (`AIAgents.tsx`, `AIAgentDetail.tsx`) driven by `AIAgentProfile`
(`src/types/aiCommand.ts:183`) — a *marketing/concept* agent shape (`tone/objective/
qualification/booking/meetingDuration/fallback`). The legacy Settings "Agent" tab edits the
*operational* voice/language/identity/models of the same underlying `/agents` entity. **Decision:
keep the two surfaces separate for now** — Settings `agent` tab owns operational fields
(voice/language/audio/transcript/identity), the AI zone owns the conceptual profile. If they
must merge, the operational fields win and `AIAgentProfile` becomes a projection. Flag this to
the reviewer; do not silently unify.

### 6.6 Repository methods to add

```ts
// Settings
getSettings(): AppSettings
saveSettings(patch: Partial<AppSettings>): Promise<AppSettings>
getSettingsSchema(): SettingsSchemaField[]
saveSettingsSchema(patch: Record<string, unknown>): Promise<void>  // Application tab

// Connections
getConnections(): ConnectionsState
saveConnection(patch: Record<string, string>): Promise<ConnectionsState>
disconnectConnection(key: ConnectionKey): Promise<ConnectionsState>

// Twilio numbers
getTwilioNumbers(): TwilioNumber[]
saveTwilioNumber(n: Partial<TwilioNumber> & { id?: string }): Promise<TwilioNumber[]>  // add or edit
removeTwilioNumber(id: string): Promise<TwilioNumber[]>

// Fish voices
getFishVoices(): FishVoice[]
addFishVoice(v: FishVoice): Promise<FishVoice[]>
removeFishVoice(referenceId: string): Promise<FishVoice[]>

// Agents (operational editing — wire into existing getAgents/getAgent surface)
updateAgent(id: string, patch: Partial<Agent>): Promise<Agent>
createAgent(patch: Partial<Agent>): Promise<Agent>
deleteAgent(id: string): Promise<void>
listAgentVoices(): Promise<{value: string; label: string}[]>      // GET /agents/voices
listAgentModels(): Promise<{audio: ModelOption[]; transcription: ModelOption[]}>  // GET /agents/models
```

---

## 7. DEPENDENCIES

- UI primitives already present and reusable: `Tabs`, `Card`/`SectionHeader`, `StatusBadge`,
  `Input`, `Textarea`, `Field`, `Button`, `Select`/`Dropdown`. No new deps.
- `repo` facade already swaps mock/http via `env.useMockData` — no structural change.
- http adapter already has `apiClient.get/put/post/delete` + `ApiError` — use them, replace
  `todo()` stubs.
- Eye-toggle (secret reveal) exists only in the **legacy** SPA (`js/core/utils.js`). The new FE
  has no secret-toggle primitive yet — a small `SecretInput` component is an implementation
  follow-up, not required for this spec.

---

## 8. SECURITY BOUNDARIES

- **Never return raw secrets.** Legacy GET responses already mask (`masked` = `first3…last4`).
  Mock records must carry only masked previews; the http adapter passes through the backend's
  masked fields — never store/echo a raw token in the client.
- **Blank secret fields = "leave unchanged".** `saveConnection`/`saveSettings` must omit empty
  secret values from the PATCH body (legacy `connections.js` already does this for secrets).
  Non-secret fields (host/port/user/host_email) send current values even when empty.
- **Disconnect = delete**, confirmed via a danger dialog, then re-fetch state.
- Twilio **Account SID is public** (type=text, no eye toggle); auth token / API keys are secrets.
- Auth transport: legacy uses HttpOnly `access_token` cookie; new FE http client sends
  `Authorization: Bearer`. The http adapter must match the target backend's auth — flag the
  mismatch as an integration decision (cookie vs bearer) rather than assuming one.
- `ENVIRONMENT_FIELDS` (openai/fish/deepseek API keys, host/port, admin creds, jwt) are
  **env-owned** and excluded from `GET/PUT /settings` — they are editable ONLY via
  `PUT /connections`. The Application tab must not render them (schema already filters them).

---

## 9. MIGRATION PLAN

1. Add types (`settings.ts`, extend `Agent`) — no behavior change.
2. Add repository methods to `MockRepository` + `httpRepository` (http stubs `todo()` first).
3. Add mock data modules mirroring the legacy responses (see §10).
4. Rewrite `ClientSettings.tsx` as the 5-tab shell; extract cards into
   `src/components/settings/*` as they grow.
5. Wire the http adapter against the live `leads_to_conversion` endpoints.
6. Smoke-test in mock mode (`VITE_USE_MOCK_DATA=true`), then flip to `false` against a running BE.

No backend changes are required — every legacy endpoint already exists and is shaped as
documented above.

---

## 10. ROLLBACK CONSIDERATIONS

- The rewrite is additive to types/repository; revert = restore the old `ClientSettings.tsx`
  and drop the new types/methods (no shared-state risk, mock store is in-memory).
- Keep the deprecated `@/data/repository` re-export intact during the transition; the rewrite
  should import from `@/api/repository` (per AGENTS.md) and leave `@/data/repository` untouched.

---

## 11. IMPLEMENTATION TASKS

Backend (no changes expected — verify shapes only):
- Confirm `GET /settings`, `/settings/schema`, `/connections`, `/twilio-numbers`, `/fish-voices`,
  `/agents`, `/agents/voices`, `/agents/models` response shapes match §6 (they do, per source).

Frontend:
1. `src/types/settings.ts` — new types (§6.1–6.4); extend `Agent` (§6.5).
2. `src/api/adapters/mock/*` — `mockSettings.ts`, `mockConnections.ts`, `mockFishVoices.ts`,
   `mockTwilioNumbers.ts`; register in `mockRepository`.
3. `src/api/adapters/http/repository.ts` — wire the new methods (§6.6).
4. `src/pages/client/ClientSettings.tsx` — 5-tab rewrite; auto-hangup header toggle.
5. `src/components/settings/*` — card components (agents list, connection rows, twilio numbers,
   fish voices, templates, application schema form).

Integration/security:
6. Resolve auth transport (cookie vs Bearer) for `client_booking_ai` → `leads_to_conversion` BE.
7. `SecretInput` eye-toggle component (reuse legacy CSS/UX pattern).

Mock data shape (for task 2) — one representative record each:
- settings → `{ ...DEFAULT_APP_SETTINGS, tts_provider: 'openai', auto_hangup: 'true', whatsapp_configured: false, email_configured: false, ... }`
- connections → 6 entries (openai/fish/deepseek/twilio/email/google_meet) with `configured/masked`.
- twilio numbers → `[{ id, label, phone: '+972…', voice: true, whatsapp: false }]`
- fish voices → `[{ name: 'Avi — warm male', reference_id: '2df9…db4db' }]`
- agents → existing `mockAgents` + new fields (`identity`, `role`, `audio_model`, `transcription_model`).
