# API Contract — client_booking_ai → leads_to_conversion

Status: WIRED. Every repository method maps to a real backend endpoint; the
`src/api/adapters/http/repository.ts` adapter is the single translation point
(snake_case → camelCase, BE enums → FE enums, wrapped lists → bare arrays).

Authoritative backend contract: `leads_to_conversion/docs/CLIENT_BOOKING_AI_API.md`
(frozen Tier-C additions) + `leads_to_conversion/docs/API.md` (full reference).

Auth is single-admin JWT (HttpOnly `access_token` cookie; `Authorization: Bearer`
accepted as fallback).

Legend: ✅ wired · ⚠️ gap (no backend route — screen renders empty/error state).

## Auth

| Repository / Auth method | Endpoint | Status |
|---|---|---|
| `loginWithCredentials` | `POST /auth/login` | ✅ |
| `clearSession` | `POST /auth/logout` | ✅ |
| `getCurrentUser` / `getSuperAdminUser` | `GET /auth/me` | ✅ (same single admin) |
| `getCurrentClient` | `GET /workspace` | ⚠️ multi-tenant — not built |
| `getClients` | `GET /admin/clients` | ⚠️ multi-tenant — not built |
| `getClient` | `GET /admin/clients/{id}` | ⚠️ multi-tenant — not built |

**Login request:** `{username, password}` → response `{user:{username}}` + HttpOnly `access_token` cookie.

## Campaigns (→ backend offers)

| Repository method | Endpoint | Status |
|---|---|---|
| `getCampaigns` | `GET /offers` | ✅ |
| `getCampaign` | `GET /offers` (client-side find) | ✅ |
| `getFeaturedCampaign` | `GET /offers` (first) | ✅ |
| `createCampaignFromDraft` | `POST /offers` | ✅ |
| `updateCampaign` | `PUT /offers/{offer_id}` | ✅ |
| `getCampaignFunnel` | `GET /offers/{offer_id}/funnel` | ✅ |
| `getCampaignHealthSnapshot` | `GET /offers/{offer_id}/health` | ✅ |
| `getCampaignPerformance` | `GET /offers/{offer_id}/performance` | ✅ |
| `getCampaignHealth` | `GET /campaigns/health` | ⚠️ not built |
| `getCampaignInsights` | `GET /campaigns/{id}/insights` | ⚠️ not built |
| `getCampaignAlerts` | `GET /campaigns/{id}/alerts` | ⚠️ not built |
| `getCampaignAnalytics` | `GET /campaigns/{id}/analytics` | ⚠️ not built (~60 fields, no source) |

A FE "campaign" maps 1:1 to a backend **offer**. `OfferCampaign` has several
aspirational fields (budget, criteria, stage, history) with no backend source —
the adapter derives status/stage from lead count and zero-fills the rest.

## Leads

| Repository method | Endpoint | Status |
|---|---|---|
| `getLeads` | `GET /leads?offer_id=` | ✅ |
| `getAllLeads` | `GET /leads` | ✅ |
| `getLead` / `findLead` | `GET /leads/{lead_id}` | ✅ |
| `setLeadStatus` | `POST /leads/{lead_id}/status` (form-encoded) | ✅ |
| `getLeadHubMetrics` | `GET /leads/metrics` | ✅ |
| `getLeadHubStats` | `GET /leads/metrics` | ✅ (see known discrepancies) |
| `getLeadSegments` | `GET /leads/segments` | ✅ |
| `getRecommendedLeads` | `GET /leads/recommended` | ✅ |
| `getPriorityLeads` | `GET /leads/priority` | ✅ |
| `getLeadIntelligence` | `GET /leads/{lead_id}/intelligence` | ✅ |
| `generateLeads` | `POST /leads/generate` | ✅ |
| `smartSearch` | `POST /leads/smart-search` | ✅ |
| `getLeadNotes` / `addLeadNote` / `updateLeadNote` / `deleteLeadNote` | `/leads/{id}/notes*` | ⚠️ not built |
| `getLeadTags` / `toggleLeadTag` | `/leads/{id}/tags*` | ⚠️ not built |
| `filterLeads` | client-side (no call) | n/a |
| lead selection (`getSelectedLeadIds`, `toggleLeadSelection`, `clearLeadSelection`, `selectAllLeads`) | client-side | n/a |

Enum translation: FE lowercase `LeadStatus` ↔ BE uppercase (`NEW`, `CONTACTED`,
`MEETING_BOOKED`, `LOST`, `INVALID`, …) — see `LEAD_STATUS_TO_BE` /
`BE_TO_LEAD_STATUS` in the adapter.

## Calls & Recordings

| Repository method | Endpoint | Status |
|---|---|---|
| `getCalls` | `GET /calls` | ✅ |
| `getCall` | `GET /calls/{call_id}` | ✅ |
| `getRecordings` | `GET /recordings` | ✅ |
| `getBookings` | `GET /bookings` | ✅ |

`Call.outcome` ↔ BE `PostCallOutcome` is translated in `mapCallOutcome`.

## Agents & Integrations

| Repository method | Endpoint | Status |
|---|---|---|
| `getAgents` | `GET /agents` | ✅ |
| `createAgent` | `POST /agents` | ✅ |
| `updateAgent` | `PUT /agents/{agent_id}` | ✅ |
| `deleteAgent` | `DELETE /agents/{agent_id}` | ✅ |
| `listAgentVoices` | `GET /agents/voices` | ✅ |
| `listAgentModels` | `GET /agents/models` | ✅ |
| `getIntegrations` | `GET /integrations` | ⚠️ OAuth — not built |

## Settings & Connections

| Repository method | Endpoint | Status |
|---|---|---|
| `getSettings` | `GET /settings` | ✅ |
| `saveSettings` | `PUT /settings` | ✅ |
| `getConnections` | `GET /connections` | ✅ |
| `saveConnection` | `PUT /connections` | ✅ |
| `disconnectConnection` | `DELETE /connections/{key}` | ✅ |
| `getTwilioNumbers` | `GET /twilio-numbers` | ✅ |
| `saveTwilioNumber` | `POST` / `PUT /twilio-numbers/{id}` | ✅ |
| `removeTwilioNumber` | `DELETE /twilio-numbers/{id}` | ✅ |
| `getSettingsSchema` | `GET /settings/schema` | ✅ |
| `getRuntimeSettings` | `GET /settings/runtime` | ⚠️ not built |
| `saveSettingsSchema` | `PUT /settings/runtime` | ⚠️ not built |
| `getFishVoices` | `GET /fish-voices` | ✅ |
| `addFishVoice` | `POST /fish-voices` | ✅ |
| `removeFishVoice` | `DELETE /fish-voices/{reference_id}` | ✅ |

## Pronunciation (fully wired)

`listPronunciationAgents` → `GET /agents` · `getGlobalLexicon` → `GET /agent/config` ·
`saveGlobalLexicon` → `PUT /agent/config` · `getAgentLexicon` → `GET /agents/{id}` ·
`saveAgentLexicon` → `PUT /agents/{id}` · `transcribePronunciation` →
`POST /agent/pronunciation/transcribe` (multipart).

## Analytics & Activity

| Repository method | Endpoint | Status |
|---|---|---|
| `getAnalytics` | `GET /analytics` | ✅ |
| `getActivity` | `GET /activity` | ✅ |
| `getAdminOverview` | `GET /admin/overview` | ✅ |
| `getAttentionItems` | `GET /attention` | ⚠️ not built |

## Admin review / approvals / training

All ⚠️ (no backend workflow yet): `getAdminMeta` (`/admin/campaigns/{id}/meta`),
`getAllAdminMeta` (`/admin/campaigns/meta`), `getCampaignReview`
(`/admin/campaigns/{id}/review`), `getCampaignAudit` (`/admin/campaigns/{id}/audit`),
`approveCampaign` / `rejectCampaign` / `requestCampaignChanges`
(`POST /admin/campaigns/{id}/{approve|reject|request-changes}`),
`getAdminNotifications` / `markAdminNotificationsRead` / `getAdminUnreadCount`
(`/admin/notifications*`), `getTrainingCampaigns` (`/admin/training/campaigns`),
`startCampaignTraining` / `completeCampaignTraining`
(`/admin/campaigns/{id}/training/*`).

## AI Command Center

| Repository method | Endpoint | Status |
|---|---|---|
| `getAIConversations` | `GET /ai/conversations` | ✅ |
| `getAIConversation` | `GET /ai/conversations/{recording_id}` | ✅ |
| `getAIBookings` | `GET /ai/bookings` | ✅ |
| `getAIFollowUps` | `GET /ai/follow-ups` | ✅ |
| `getAIAgentProfile` | `GET /ai/agents/{agent_id}` | ✅ |
| `getAIOverview` | `GET /ai/overview` | ⚠️ not built |
| `getAIActivity` | `GET /ai/activity` | ⚠️ not built |
| `getAIObjections` | `GET /ai/objections` | ⚠️ not built |
| `getAILearningPatterns` / `getAIImprovements` | `/ai/learning/*` | ⚠️ not built |
| `getAIEscalations` | `GET /ai/escalations` | ⚠️ not built |
| `getAIInsights` | `GET /ai/insights` | ⚠️ not built |
| `getAIHealth` | `GET /ai/health` | ⚠️ not built |
| `getAIPerformance` | `GET /ai/performance` | ⚠️ not built |
| `searchAI` | `GET /ai/search?q=` | ⚠️ not built |
| `markConversationViewed` | `POST /ai/conversations/{id}/viewed` | ⚠️ not built |
| `addSimulatedActivity` | `POST /ai/activity` | ⚠️ not built |

A "conversation" in the AI Command Center **is** a call recording (no separate
`ai_conversations` entity).

## Shape conventions

- Wire names are snake_case (`offer_id`, `lead_id`, `meeting_link`); the adapter translates to camelCase FE types.
- Wrapped list responses are unwrapped in the adapter: `/leads` → `{leads,total,offset,limit}` → `leads`; `/twilio-numbers` → `{numbers}`; `/fish-voices` → `{voices}`; `/agents/voices` → `{voices}`; `/settings/schema` → `{fields}`.
- Errors: `401` (clear session), `400` (`detail`), `404`, `204` delete. `ApiClient` throws `ApiError{status,body}` — adapters do not swallow errors.

## Known discrepancies (tracked — not mock data)

Four repository methods currently call a legacy path the backend serves under a
different name (defect, corrected separately):

| Method | FE path (current) | Correct BE path |
|---|---|---|
| `getCampaignFunnel` | `GET /campaigns/{id}/funnel` | `GET /offers/{id}/funnel` |
| `getCampaignHealthSnapshot` | `GET /campaigns/{id}/health` | `GET /offers/{id}/health` |
| `getCampaignPerformance` | `GET /campaigns/{id}/performance` | `GET /offers/{id}/performance` |
| `getLeadHubStats` | `GET /leads/stats` | `GET /leads/metrics` |

Type reference: all domain types in `src/types/`.
