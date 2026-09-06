import { env } from '@/config/environment'
import { mockRepository } from './adapters/mock/repository'
import { httpRepository } from './adapters/http/repository'
import type { Repository } from './contracts'

export const repo: Repository = env.useMockData ? mockRepository : httpRepository

export type { Repository } from './contracts'
