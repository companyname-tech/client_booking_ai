# API Contract

Suggested REST endpoints for `httpRepository`. Align your backend to return shapes defined in `src/types/`.

## Auth

| Method | Endpoint | Repository / Auth |
|--------|----------|-------------------|
| POST | `/auth/login` | `authService.loginWithCredentials` |
| POST | `/auth/logout` | `authService.clearSession` |
| GET | `/me` | `getCurrentUser` |

**Login response:**
```json
{
  "session": { "zone": "client", "email": "...", "name": "..." },
  "token": "jwt..."
}
```

## Session / Workspace

| Method | Endpoint | Repository method |
|--------|----------|-------------------|
| GET | `/workspace` | `getCurrentClient` |
| GET | `/admin/clients` | `getClients` |
| GET | `/admin/clients/:id` | `getClient` |

## Campaigns

| Method | Endpoint | Repository method |
|--------|----------|-------------------|
| GET | `/campaigns` | `getCampaigns` |
| GET | `/campaigns/:id` | `getCampaign` |
| POST | `/campaigns` | `createCampaignFromDraft` |
| PATCH | `/campaigns/:id` | `updateCampaign` |
| GET | `/campaigns/:id/funnel` | `getCampaignFunnel` |
| GET | `/campaigns/:id/analytics` | `getCampaignAnalytics` |
| GET | `/campaigns/:id/health` | `getCampaignHealthSnapshot` |
| GET | `/campaigns/:id/insights` | `getCampaignInsights` |
| GET | `/campaigns/:id/alerts` | `getCampaignAlerts` |
| GET | `/campaigns/:id/performance` | `getCampaignPerformance` |

Types: `Campaign`, `CampaignDraft` in `src/types/`, `src/types/campaignDraft.ts`

## Leads

| Method | Endpoint | Repository method |
|--------|----------|-------------------|
| GET | `/campaigns/:id/leads` | `getLeads` |
| GET | `/campaigns/:campaignId/leads/:leadId` | `getLead` |
| GET | `/leads` | `getAllLeads` |
| GET | `/leads/:id` | `findLead` |
| GET | `/leads/:id/intelligence` | `getLeadIntelligence` |
| GET | `/leads/metrics` | `getLeadHubMetrics` |
| GET | `/leads/segments` | `getLeadSegments` |
| PATCH | `/leads/:id/status` | `setLeadStatus` |
| GET | `/leads/:id/notes` | `getLeadNotes` |
| POST | `/leads/:id/notes` | `addLeadNote` |
| PATCH | `/leads/:id/notes/:noteId` | `updateLeadNote` |
| DELETE | `/leads/:id/notes/:noteId` | `deleteLeadNote` |

Types: `Lead` in `src/types/`, `EnrichedLead`, `LeadIntelligenceProfile` in `src/types/leadIntelligence.ts`

## Calls & Recordings

| Method | Endpoint | Repository method |
|--------|----------|-------------------|
| GET | `/calls` | `getCalls` |
| GET | `/calls/:id` | `getCall` |
| GET | `/campaigns/:id/recordings` | `getRecordings` |
| GET | `/bookings` | `getBookings` |

Types: `Call`, `CallDetail`, `Booking` in `src/types/`

## AI Command Center

| Method | Endpoint | Repository method |
|--------|----------|-------------------|
| GET | `/ai/overview` | `getAIOverview` |
| GET | `/ai/activity` | `getAIActivity` |
| GET | `/ai/conversations` | `getAIConversations` |
| GET | `/ai/conversations/:id` | `getAIConversation` |
| POST | `/ai/conversations/:id/viewed` | `markConversationViewed` |
| GET | `/ai/objections` | `getAIObjections` |
| GET | `/ai/follow-ups` | `getAIFollowUps` |
| GET | `/ai/escalations` | `getAIEscalations` |
| GET | `/ai/bookings` | `getAIBookings` |
| GET | `/ai/insights` | `getAIInsights` |
| GET | `/ai/health` | `getAIHealth` |
| GET | `/ai/agents/:id` | `getAIAgentProfile` |
| GET | `/ai/performance` | `getAIPerformance` |
| GET | `/ai/search?q=` | `searchAI` |

Types: `src/types/aiCommand.ts`

## Admin

| Method | Endpoint | Repository method |
|--------|----------|-------------------|
| GET | `/admin/overview` | `getAdminOverview` |
| GET | `/admin/campaigns/:id/review` | `getCampaignReview` |
| GET | `/admin/campaigns/:id/audit` | `getCampaignAudit` |
| POST | `/admin/campaigns/:id/approve` | `approveCampaign` |
| POST | `/admin/campaigns/:id/reject` | `rejectCampaign` |
| POST | `/admin/campaigns/:id/request-changes` | `requestCampaignChanges` |
| GET | `/admin/notifications` | `getAdminNotifications` |
| POST | `/admin/notifications/read` | `markAdminNotificationsRead` |
| GET | `/admin/training/campaigns` | `getTrainingCampaigns` |
| POST | `/admin/campaigns/:id/training/start` | `startCampaignTraining` |
| POST | `/admin/campaigns/:id/training/complete` | `completeCampaignTraining` |

Types: `src/types/admin.ts`

## Analytics & Activity

| Method | Endpoint | Repository method |
|--------|----------|-------------------|
| GET | `/analytics` | `getAnalytics` |
| GET | `/activity` | `getActivity` |
| GET | `/attention` | `getAttentionItems` |
| GET | `/agents` | `getAgents` |
| GET | `/integrations` | `getIntegrations` |

## Type reference

All domain types: `src/types/index.ts` and feature-specific files in `src/types/`.

When implementing an endpoint, open the corresponding mock method in `src/api/adapters/mock/repository.ts` to see expected return shape and behavior.
