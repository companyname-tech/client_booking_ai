import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Activity,
  Disc3,
  Phone,
  Settings,
  Users,
} from 'lucide-react'
import PlaceholderPage from '@/pages/PlaceholderPage'
import { campaignSubRoutes } from './client.routes'

const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'))
const AdminCampaigns = lazy(() => import('@/pages/admin/AdminCampaigns'))
const AdminCampaignReview = lazy(() => import('@/pages/admin/AdminCampaignReview'))
const AdminApprovals = lazy(() => import('@/pages/admin/AdminApprovals'))
const AdminAITraining = lazy(() => import('@/pages/admin/AdminAITraining'))
const AdminCompliance = lazy(() => import('@/pages/admin/AdminCompliance'))
const AdminClients = lazy(() => import('@/pages/admin/AdminClients'))
const AdminClientDetail = lazy(() => import('@/pages/admin/AdminClientDetail'))
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
  { path: 'approvals', element: <AdminApprovals /> },
  { path: 'ai-training', element: <AdminAITraining /> },
  { path: 'compliance', element: <AdminCompliance /> },
  { path: 'clients', element: <AdminClients /> },
  { path: 'clients/:id', element: <AdminClientDetail /> },
  { path: 'activity', element: <PlaceholderPage zone="admin" title="Activity" description="Platform-wide audit trail and system events." icon={<Activity />} /> },
  { path: 'leads', element: <PlaceholderPage zone="admin" title="Leads" description="Platform-wide lead inventory." icon={<Users />} /> },
  { path: 'calls', element: <PlaceholderPage zone="admin" title="Calls" description="Monitor live and historical calls across agents." icon={<Phone />} /> },
  { path: 'recordings', element: <PlaceholderPage zone="admin" title="Recordings" description="QA review of call recordings." icon={<Disc3 />} /> },
  { path: 'settings', element: <PlaceholderPage zone="admin" title="Settings" description="Console configuration." icon={<Settings />} /> },
]
