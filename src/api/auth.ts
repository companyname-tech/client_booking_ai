import { env } from '@/config/environment'
import { mockAuthService } from './adapters/mock/auth'
import { httpAuthService } from './adapters/http/auth'

export const authService = env.useMockData ? mockAuthService : httpAuthService

export type { AuthService, AuthSession, LoginResult } from './contracts/auth'
