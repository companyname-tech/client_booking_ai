import { lazyRoute } from '@/lib/lazyRoute'
import { Navigate } from 'react-router-dom'
import { PermGate } from '@/components/auth/PermGate'
import { campaignSubRoutes } from './client.routes'

const AdminOverview = lazyRoute(() => import('@/pages/admin/AdminOverview'))
const AdminCampaigns = lazyRoute(() => import('@/pages/admin/AdminCampaigns'))
const AdminCampaignReview = lazyRoute(() => import('@/pages/admin/AdminCampaignReview'))
const AdminAITraining = lazyRoute(() => import('@/pages/admin/AdminAITraining'))
const AdminTrainingSettings = lazyRoute(() => import('@/pages/admin/AdminTrainingSettings'))
const AdminClients = lazyRoute(() => import('@/pages/admin/AdminClients'))
const AdminClientDetail = lazyRoute(() => import('@/pages/admin/AdminClientDetail'))
const AdminClientSettings = lazyRoute(() => import('@/pages/admin/AdminClientSettings'))
const AdminSettings = lazyRoute(() => import('@/pages/admin/AdminSettings'))
const AdminActivity = lazyRoute(() => import('@/pages/admin/AdminActivity'))
const AdminLeads = lazyRoute(() => import('@/pages/admin/AdminLeads'))
const AdminCalls = lazyRoute(() => import('@/pages/admin/AdminCalls'))
const AdminCosts = lazyRoute(() => import('@/pages/admin/AdminCosts'))
const AdminUsers = lazyRoute(() => import('@/pages/admin/AdminUsers'))
const AdminPermissions = lazyRoute(() => import('@/pages/admin/AdminPermissions'))
const AdminDoNotContact = lazyRoute(() => import('@/pages/admin/AdminDoNotContact'))
const CampaignDetailLayout = lazyRoute(() => import('@/pages/client/CampaignDetailLayout'))
const CampaignDetailOverview = lazyRoute(() => import('@/pages/client/CampaignDetailOverview'))
const MessagingLayout = lazyRoute(() => import('@/pages/messaging/MessagingLayout'))
const MessagingEmail = lazyRoute(() => import('@/pages/messaging/MessagingEmail'))
const MessagingWhatsApp = lazyRoute(() => import('@/pages/messaging/MessagingWhatsApp'))

export const adminRoutes = [
  { index: true, element: <Navigate to="/admin/overview" replace /> },
  { path: 'overview', element: <PermGate><AdminOverview /></PermGate> },
  { path: 'campaigns', element: <PermGate perm="campaigns.view"><AdminCampaigns /></PermGate> },
  { path: 'campaigns/:id/review', element: <PermGate perm="campaigns.view"><AdminCampaignReview /></PermGate> },
  {
    path: 'campaigns/:id',
    element: (
      <PermGate perm="campaigns.view">
        <CampaignDetailLayout zone="admin" />
      </PermGate>
    ),
    children: [{ index: true, element: <CampaignDetailOverview /> }, ...campaignSubRoutes],
  },
  { path: 'approvals', element: <Navigate to="/admin/campaigns" replace /> },
  { path: 'ai-training', element: <PermGate perm="ai_training.view"><AdminAITraining /></PermGate> },
  { path: 'ai-training/settings', element: <PermGate perm="settings.view"><AdminTrainingSettings /></PermGate> },
  { path: 'clients', element: <PermGate perm="clients.view"><AdminClients /></PermGate> },
  { path: 'clients/:id/settings', element: <PermGate perm="clients.edit"><AdminClientSettings /></PermGate> },
  { path: 'clients/:id', element: <PermGate perm="clients.view"><AdminClientDetail /></PermGate> },
  { path: 'activity', element: <PermGate perm="activity.view"><AdminActivity /></PermGate> },
  { path: 'leads', element: <PermGate perm="leads.view"><AdminLeads /></PermGate> },
  { path: 'calls', element: <PermGate perm="calls.view"><AdminCalls /></PermGate> },
  {
    path: 'messaging',
    element: <MessagingLayout zone="admin" />,
    children: [
      { index: true, element: <Navigate to="/admin/messaging/email" replace /> },
      { path: 'email', element: <MessagingEmail /> },
      { path: 'whatsapp', element: <MessagingWhatsApp /> },
    ],
  },
  { path: 'costs', element: <PermGate perm="costs.view"><AdminCosts /></PermGate> },
  { path: 'users', element: <PermGate perm="users.manage"><AdminUsers /></PermGate> },
  { path: 'permissions', element: <PermGate perm="users.manage"><AdminPermissions /></PermGate> },
  { path: 'do-not-contact', element: <PermGate perm="users.manage"><AdminDoNotContact /></PermGate> },
  { path: 'recordings', element: <Navigate to="/admin/calls" replace /> },
  { path: 'settings', element: <PermGate perm="settings.view"><AdminSettings /></PermGate> },
]
