import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { PermGate } from '@/components/auth/PermGate'
import { campaignSubRoutes } from './client.routes'

const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'))
const AdminCampaigns = lazy(() => import('@/pages/admin/AdminCampaigns'))
const AdminCampaignReview = lazy(() => import('@/pages/admin/AdminCampaignReview'))
const AdminAITraining = lazy(() => import('@/pages/admin/AdminAITraining'))
const AdminTrainingSettings = lazy(() => import('@/pages/admin/AdminTrainingSettings'))
const AdminClients = lazy(() => import('@/pages/admin/AdminClients'))
const AdminClientDetail = lazy(() => import('@/pages/admin/AdminClientDetail'))
const AdminClientSettings = lazy(() => import('@/pages/admin/AdminClientSettings'))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'))
const AdminActivity = lazy(() => import('@/pages/admin/AdminActivity'))
const AdminLeads = lazy(() => import('@/pages/admin/AdminLeads'))
const AdminCalls = lazy(() => import('@/pages/admin/AdminCalls'))
const AdminCosts = lazy(() => import('@/pages/admin/AdminCosts'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminPermissions = lazy(() => import('@/pages/admin/AdminPermissions'))
const CampaignDetailLayout = lazy(() => import('@/pages/client/CampaignDetailLayout'))
const CampaignDetailOverview = lazy(() => import('@/pages/client/CampaignDetailOverview'))

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
  { path: 'costs', element: <PermGate perm="costs.view"><AdminCosts /></PermGate> },
  { path: 'users', element: <PermGate perm="users.manage"><AdminUsers /></PermGate> },
  { path: 'permissions', element: <PermGate perm="users.manage"><AdminPermissions /></PermGate> },
  { path: 'recordings', element: <Navigate to="/admin/calls" replace /> },
  { path: 'settings', element: <PermGate perm="settings.view"><AdminSettings /></PermGate> },
]
