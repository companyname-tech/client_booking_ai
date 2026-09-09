import { lazyRoute } from '@/lib/lazyRoute'
import { Navigate } from 'react-router-dom'
import {
  MessageSquare,
  UsersRound,
} from 'lucide-react'
import { PermGate } from '@/components/auth/PermGate'
import PlaceholderPage from '@/pages/PlaceholderPage'

const ClientOverview = lazyRoute(() => import('@/pages/client/ClientOverview'))
const ClientCampaigns = lazyRoute(() => import('@/pages/client/ClientCampaigns'))
const CampaignOnboarding = lazyRoute(() => import('@/pages/client/CampaignOnboarding'))
const CampaignDetailLayout = lazyRoute(() => import('@/pages/client/CampaignDetailLayout'))
const CampaignDetailOverview = lazyRoute(() => import('@/pages/client/CampaignDetailOverview'))
const CampaignLeads = lazyRoute(() => import('@/pages/client/CampaignLeads'))
const CampaignRecordings = lazyRoute(() => import('@/pages/client/CampaignRecordings'))
const CampaignActivity = lazyRoute(() => import('@/pages/client/CampaignActivity'))
const CampaignAnalytics = lazyRoute(() => import('@/pages/client/CampaignAnalytics'))
const CampaignIntegrations = lazyRoute(() => import('@/pages/client/CampaignIntegrations'))
const ClientSettings = lazyRoute(() => import('@/pages/client/ClientSettings'))
const AILayout = lazyRoute(() => import('@/pages/client/ai/AILayout'))
const AICommandCenter = lazyRoute(() => import('@/pages/client/ai/AICommandCenter'))
const AIConversations = lazyRoute(() => import('@/pages/client/ai/AIConversations'))
const AIConversationDetail = lazyRoute(() => import('@/pages/client/ai/AIConversationDetail'))
const AILearning = lazyRoute(() => import('@/pages/client/ai/AILearning'))
const AIPerformance = lazyRoute(() => import('@/pages/client/ai/AIPerformance'))
const AIAgents = lazyRoute(() => import('@/pages/client/ai/AIAgents'))
const AIAgentDetail = lazyRoute(() => import('@/pages/client/ai/AIAgentDetail'))
const ClientRecordings = lazyRoute(() => import('@/pages/client/ClientRecordings'))
const ClientBookings = lazyRoute(() => import('@/pages/client/ClientBookings'))
const CalendarScreen = lazyRoute(() => import('@/pages/client/CalendarScreen'))
const ClientDownloads = lazyRoute(() => import('@/pages/client/ClientDownloads'))
const ClientAnalytics = lazyRoute(() => import('@/pages/client/ClientAnalytics'))

/**
 * Shared per-campaign tabs for BOTH zones (client.routes spreads them under
 * `/client/campaigns/:id`, admin.routes under `/admin/campaigns/:id`).
 * The catalog-mapped tabs are gated per console family so a deep link is
 * guarded even when the campaign detail parent gate already passed.
 * `analytics` / `integrations` are client-workspace internals (not catalog
 * console areas) and stay open to every reachable session.
 */
export const campaignSubRoutes = [
  { path: 'leads', element: <PermGate perm="leads.view"><CampaignLeads /></PermGate> },
  { path: 'calls', element: <PermGate perm="calls.view"><CampaignRecordings /></PermGate> },
  { path: 'activity', element: <PermGate perm="activity.view"><CampaignActivity /></PermGate> },
  { path: 'analytics', element: <CampaignAnalytics /> },
  { path: 'integrations', element: <CampaignIntegrations /> },
]

export const clientRoutes = [
  { index: true, element: <Navigate to="/client/overview" replace /> },
  { path: 'overview', element: <ClientOverview /> },
  { path: 'campaigns', element: <PermGate perm="campaigns.view"><ClientCampaigns /></PermGate> },
  { path: 'campaigns/new', element: <CampaignOnboarding /> },
  { path: 'campaigns/:id/onboarding', element: <CampaignOnboarding /> },
  {
    path: 'campaigns/:id',
    element: <PermGate perm="campaigns.view"><CampaignDetailLayout /></PermGate>,
    children: [{ index: true, element: <CampaignDetailOverview /> }, ...campaignSubRoutes],
  },
  { path: 'analytics', element: <ClientAnalytics /> },
  {
    path: 'ai',
    element: <PermGate perm="ai_training.view"><AILayout /></PermGate>,
    children: [
      { index: true, element: <AICommandCenter /> },
      { path: 'conversations', element: <AIConversations /> },
      { path: 'conversations/:id', element: <AIConversationDetail /> },
      { path: 'learning', element: <AILearning /> },
      { path: 'performance', element: <AIPerformance /> },
      { path: 'agents', element: <AIAgents /> },
      { path: 'agents/:id', element: <AIAgentDetail /> },
    ],
  },
  { path: 'agents', element: <Navigate to="/client/ai/agents" replace /> },
  { path: 'messages', element: <PlaceholderPage title="Messages" description="Email and WhatsApp follow-ups sent by the AI." icon={<MessageSquare />} /> },
  { path: 'recordings', element: <PermGate perm="calls.view"><ClientRecordings /></PermGate> },
  { path: 'bookings', element: <ClientBookings /> },
  { path: 'calendar', element: <CalendarScreen /> },
  { path: 'integrations', element: <Navigate to="/client/settings?tab=connection" replace /> },
  { path: 'downloads', element: <ClientDownloads /> },
  { path: 'team', element: <PlaceholderPage title="Team" description="Invite teammates and manage roles." icon={<UsersRound />} /> },
  { path: 'settings', element: <PermGate perm="settings.view"><ClientSettings /></PermGate> },
]
