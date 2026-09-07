import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import {
  MessageSquare,
  UsersRound,
} from 'lucide-react'
import PlaceholderPage from '@/pages/PlaceholderPage'

const ClientOverview = lazy(() => import('@/pages/client/ClientOverview'))
const ClientCampaigns = lazy(() => import('@/pages/client/ClientCampaigns'))
const CampaignOnboarding = lazy(() => import('@/pages/client/CampaignOnboarding'))
const CampaignDetailLayout = lazy(() => import('@/pages/client/CampaignDetailLayout'))
const CampaignDetailOverview = lazy(() => import('@/pages/client/CampaignDetailOverview'))
const CampaignLeads = lazy(() => import('@/pages/client/CampaignLeads'))
const CampaignRecordings = lazy(() => import('@/pages/client/CampaignRecordings'))
const CampaignAnalytics = lazy(() => import('@/pages/client/CampaignAnalytics'))
const CampaignIntegrations = lazy(() => import('@/pages/client/CampaignIntegrations'))
const ClientSettings = lazy(() => import('@/pages/client/ClientSettings'))
const AILayout = lazy(() => import('@/pages/client/ai/AILayout'))
const AICommandCenter = lazy(() => import('@/pages/client/ai/AICommandCenter'))
const AIConversations = lazy(() => import('@/pages/client/ai/AIConversations'))
const AIConversationDetail = lazy(() => import('@/pages/client/ai/AIConversationDetail'))
const AILearning = lazy(() => import('@/pages/client/ai/AILearning'))
const AIPerformance = lazy(() => import('@/pages/client/ai/AIPerformance'))
const AIAgents = lazy(() => import('@/pages/client/ai/AIAgents'))
const AIAgentDetail = lazy(() => import('@/pages/client/ai/AIAgentDetail'))
const ClientRecordings = lazy(() => import('@/pages/client/ClientRecordings'))
const ClientBookings = lazy(() => import('@/pages/client/ClientBookings'))
const ClientDownloads = lazy(() => import('@/pages/client/ClientDownloads'))
const ClientAnalytics = lazy(() => import('@/pages/client/ClientAnalytics'))

export const campaignSubRoutes = [
  { path: 'leads', element: <CampaignLeads /> },
  { path: 'calls', element: <CampaignRecordings /> },
  { path: 'analytics', element: <CampaignAnalytics /> },
  { path: 'integrations', element: <CampaignIntegrations /> },
]

export const clientRoutes = [
  { index: true, element: <Navigate to="/client/overview" replace /> },
  { path: 'overview', element: <ClientOverview /> },
  { path: 'campaigns', element: <ClientCampaigns /> },
  { path: 'campaigns/new', element: <CampaignOnboarding /> },
  { path: 'campaigns/:id/onboarding', element: <CampaignOnboarding /> },
  {
    path: 'campaigns/:id',
    element: <CampaignDetailLayout />,
    children: [{ index: true, element: <CampaignDetailOverview /> }, ...campaignSubRoutes],
  },
  { path: 'analytics', element: <ClientAnalytics /> },
  {
    path: 'ai',
    element: <AILayout />,
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
  { path: 'recordings', element: <ClientRecordings /> },
  { path: 'bookings', element: <ClientBookings /> },
  { path: 'integrations', element: <Navigate to="/client/settings?tab=connection" replace /> },
  { path: 'downloads', element: <ClientDownloads /> },
  { path: 'team', element: <PlaceholderPage title="Team" description="Invite teammates and manage roles." icon={<UsersRound />} /> },
  { path: 'settings', element: <ClientSettings /> },
]
