import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { Disc3 } from 'lucide-react'
import PlaceholderPage from '@/pages/PlaceholderPage'
import { campaignSubRoutes } from './client.routes'

const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'))
const AdminCampaigns = lazy(() => import('@/pages/admin/AdminCampaigns'))
const AdminCampaignReview = lazy(() => import('@/pages/admin/AdminCampaignReview'))
const AdminAITraining = lazy(() => import('@/pages/admin/AdminAITraining'))
const AdminClients = lazy(() => import('@/pages/admin/AdminClients'))
const AdminClientDetail = lazy(() => import('@/pages/admin/AdminClientDetail'))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'))
const AdminActivity = lazy(() => import('@/pages/admin/AdminActivity'))
const AdminLeads = lazy(() => import('@/pages/admin/AdminLeads'))
const AdminCalls = lazy(() => import('@/pages/admin/AdminCalls'))
const CampaignDetailLayout = lazy(() => import('@/pages/client/CampaignDetailLayout'))
const CampaignDetailOverview = lazy(() => import('@/pages/client/CampaignDetailOverview'))

export const adminRoutes = [
  { index: true, element: <Navigate to="/admin/overview" replace /> },
  { path: 'overview', element: <AdminOverview /> },
  { path: 'campaigns', element: <AdminCampaigns /> },
  { path: 'campaigns/:id/review', element: <AdminCampaignReview /> },
  {
    path: 'campaigns/:id',
    element: <CampaignDetailLayout zone="admin" />,
    children: [
      { index: true, element: <CampaignDetailOverview /> },
      ...campaignSubRoutes.slice(0, 4),
    ],
  },
  { path: 'approvals', element: <Navigate to="/admin/campaigns" replace /> },
  { path: 'ai-training', element: <AdminAITraining /> },
  { path: 'clients', element: <AdminClients /> },
  { path: 'clients/:id', element: <AdminClientDetail /> },
  { path: 'activity', element: <AdminActivity /> },
  { path: 'leads', element: <AdminLeads /> },
  { path: 'calls', element: <AdminCalls /> },
  { path: 'recordings', element: <PlaceholderPage zone="admin" title="Recordings" description="QA review of call recordings." icon={<Disc3 />} /> },
  { path: 'settings', element: <AdminSettings /> },
]
