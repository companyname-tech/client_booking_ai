import type { Client, User } from '@/types'
import { daysAgo } from './time'

export const currentUser: User = {
  id: 'usr_sarah',
  name: 'Sarah Whitmore',
  email: 'sarah@acmegrowth.com',
  role: 'owner',
}

export const superAdminUser: User = {
  id: 'usr_admin',
  name: 'Daniel Osei',
  email: 'daniel@aibookingagent.com',
  role: 'super_admin',
}

export const mockClients: Client[] = [
  {
    id: 'cli_acme',
    name: 'Acme Growth',
    slug: 'acme-growth',
    industry: 'B2B Growth Agency',
    plan: 'growth',
    createdAt: daysAgo(94),
    primaryContact: currentUser,
  },
  {
    id: 'cli_northwind',
    name: 'Northwind Dental',
    slug: 'northwind-dental',
    industry: 'Healthcare',
    plan: 'starter',
    createdAt: daysAgo(41),
    primaryContact: { id: 'usr_nw', name: 'Priya Raman', email: 'priya@northwind.dental', role: 'owner' },
  },
  {
    id: 'cli_vertex',
    name: 'Vertex Capital',
    slug: 'vertex-capital',
    industry: 'Commercial Real Estate',
    plan: 'enterprise',
    createdAt: daysAgo(210),
    primaryContact: { id: 'usr_vx', name: 'Marcus Lee', email: 'marcus@vertexcap.com', role: 'owner' },
  },
  {
    id: 'cli_lumen',
    name: 'Lumen SaaS Labs',
    slug: 'lumen-saas',
    industry: 'Software',
    plan: 'growth',
    createdAt: daysAgo(18),
    primaryContact: { id: 'usr_lm', name: 'Ines Duarte', email: 'ines@lumen.dev', role: 'admin' },
  },
]

export const currentClient = mockClients[0]
