import { authService } from '@/api/auth'
import type { AuthSession, LoginResult } from '@/api/contracts/auth'

export type { AuthSession, LoginResult } from '@/api/contracts/auth'

export function homeForZone(zone: import('@/lib/navigation').Zone) {
  return authService.homeForZone(zone)
}

export function readSession(): AuthSession | null {
  return authService.readSession()
}

export function clearSession(): Promise<void> {
  return authService.clearSession()
}

export function loginWithCredentials(username: string, password: string): Promise<LoginResult> {
  return authService.loginWithCredentials(username, password)
}
