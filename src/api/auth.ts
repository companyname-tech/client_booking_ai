import { httpAuthService } from './adapters/http/auth'

export const authService = httpAuthService

export type { AuthService, AuthSession, LoginResult } from './contracts/auth'
