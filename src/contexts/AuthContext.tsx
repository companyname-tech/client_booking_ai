import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { authService, type AuthSession, type LoginResult } from '@/api/auth'

interface AuthContextValue {
  session: AuthSession | null
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => authService.readSession())

  const login = useCallback(async (username: string, password: string) => {
    const result = await authService.loginWithCredentials(username, password)
    if (result.ok) setSession(result.session)
    return result
  }, [])

  const logout = useCallback(async () => {
    await authService.clearSession()
    setSession(null)
  }, [])

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
