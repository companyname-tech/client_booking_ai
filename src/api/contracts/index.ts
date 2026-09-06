import type { MockRepository } from '../adapters/mock/repository'

/** Repository contract — all UI data access goes through this interface. */
export type Repository = MockRepository

export type { AuthService, AuthSession, LoginResult } from './auth'
