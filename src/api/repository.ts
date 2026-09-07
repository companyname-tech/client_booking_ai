import { httpRepository } from './adapters/http/repository'
import type { Repository } from './contracts'

export const repo: Repository = httpRepository

export type { Repository } from './contracts'
