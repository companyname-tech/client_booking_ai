# Feature Map

Logical index of domains — pages, components, and repository methods. Physical files stay in `pages/` and `components/`.

## Campaigns

| | Path |
|---|---|
| Pages | `src/pages/client/ClientCampaigns.tsx`, `CampaignDetailLayout.tsx`, `CampaignDetailOverview.tsx`, `CampaignOnboarding.tsx`, `Campaign*.tsx` |
| Components | `src/components/campaigns/`, `src/components/campaign/`, `src/components/onboarding/` |
| Repository | `getCampaigns`, `getCampaign`, `createCampaignFromDraft`, `updateCampaign`, `getCampaignFunnel`, `getCampaignAnalytics`, `getCampaignHealthSnapshot` |

## Lead Intelligence

| | Path |
|---|---|
| Pages | `src/pages/client/leads/` |
| Components | `src/components/leads/` |
| Repository | `getAllLeads`, `getLeadHubMetrics`, `filterLeads`, `getLeadIntelligence`, `getLeadNotes`, `addLeadNote`, `setLeadStatus` |

## AI Command Center

| | Path |
|---|---|
| Pages | `src/pages/client/ai/` |
| Components | `src/components/ai/` |
| Repository | `getAIOverview`, `getAIConversations`, `getAIConversation`, `getAIObjections`, `getAIFollowUps`, `getAIBookings` |

## Admin / Super Admin

| | Path |
|---|---|
| Pages | `src/pages/admin/` |
| Components | `src/components/admin/` |
| Repository | `getAdminOverview`, `approveCampaign`, `rejectCampaign`, `getCampaignReview`, `getTrainingCampaigns` |

## Do-not-contact (global suppression list)

| | Path |
|---|---|
| Pages | `src/pages/admin/AdminDoNotContact.tsx` |
| Types | `src/types/doNotContact.ts` |
| Repository | `getDoNotContactPage`, `addDoNotContact`, `removeDoNotContact` |

## Auth & Shell

| | Path |
|---|---|
| Pages | `src/pages/LoginPage.tsx` |
| Components | `src/components/shell/`, `src/components/auth/` |
| API | `authService` in `src/api/auth.ts` |

## Shared UI

| | Path |
|---|---|
| Design system | `src/components/ui/` |
| Layout | `src/components/layout/` |
| Motion | `src/components/motion/` |
| Tokens | `src/styles/globals.css` |
