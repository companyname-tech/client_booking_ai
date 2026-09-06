import type { Agent, Integration } from '@/types'
import { daysAgo, minutesAgo } from './time'

export const mockAgents: Agent[] = [
  {
    id: 'agt_avi',
    name: 'Avi',
    voice: 'Professional · Male · US',
    language: 'English (US)',
    status: 'calling',
    campaignIds: ['cmp_q4_arch', 'cmp_fintech', 'cmp_saas_founders', 'cmp_cre'],
    callsToday: 2842,
    successRate: 94.2,
    trainingProgress: 94,
  },
  {
    id: 'agt_nova',
    name: 'Nova',
    voice: 'Warm · Female · US',
    language: 'English (US)',
    status: 'training',
    campaignIds: ['cmp_q4_arch', 'cmp_fintech'],
    callsToday: 212,
    successRate: 13.2,
    trainingProgress: 64,
  },
  {
    id: 'agt_atlas',
    name: 'Atlas',
    voice: 'Confident · Male · US',
    language: 'English (US)',
    status: 'calling',
    campaignIds: ['cmp_saas_founders'],
    callsToday: 341,
    successRate: 13.9,
    trainingProgress: 100,
  },
  {
    id: 'agt_sol',
    name: 'Sol',
    voice: 'Neutral · Female · UK',
    language: 'English (UK)',
    status: 'idle',
    campaignIds: ['cmp_cre', 'cmp_logistics'],
    callsToday: 0,
    successRate: 11.4,
    trainingProgress: 100,
  },
]

export const mockIntegrations: Integration[] = [
  {
    provider: 'gmail',
    state: 'connected',
    account: 'sarah@acmegrowth.com',
    connectedAt: daysAgo(90),
    lastSyncAt: minutesAgo(4),
  },
  {
    provider: 'calendly',
    state: 'disconnected',
  },
  {
    provider: 'zoom',
    state: 'connected',
    account: 'Acme Growth (Pro)',
    connectedAt: daysAgo(88),
    lastSyncAt: minutesAgo(11),
  },
]
