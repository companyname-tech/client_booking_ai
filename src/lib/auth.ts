import { env } from '@/config/environment'
import { mockAuthService } from '@/api/adapters/mock/auth'
import { httpAuthService } from '@/api/adapters/http/auth'
import type { AuthService } from '@/api/contracts/auth'

export const authService: AuthService = env.useMockData ? mockAuthService : httpAuthService

export type { AuthSession, LoginResult } from '@/api/contracts/auth'

export function homeForZone(zone: import('@/lib/navigation').Zone) {
  return authService.homeForZone(zone)
}

/** @deprecated Use authService from @/api/auth */
export const DEMO_CREDENTIALS = {
  client: { email: 'sarah@acmegrowth.com', password: 'client' },
  admin: { email: 'daniel@aibookingagent.com', password: 'admin' },
}

export function readSession() {
  return authService.readSession()
}

export function clearSession() {
  return authService.clearSession()
}

export function loginAsClient() {
  return authService.loginAsClient()
}

export function loginAsAdmin() {
  return authService.loginAsAdmin()
}

export function loginWithCredentials(email: string, password: string) {
  return authService.loginWithCredentials(email, password)
}
