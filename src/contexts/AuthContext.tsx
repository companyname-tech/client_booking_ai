import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { authService, type AuthSession } from '@/api/auth'

interface AuthContextValue {
  session: AuthSession | null
  loginClient: () => AuthSession
  loginAdmin: () => AuthSession
  login: (email: string, password: string) => { ok: true; session: AuthSession } | { ok: false; error: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => authService.readSession())

  const loginClient = useCallback(() => {
    const next = authService.loginAsClient()
    setSession(next)
    return next
  }, [])

  const loginAdmin = useCallback(() => {
    const next = authService.loginAsAdmin()
    setSession(next)
    return next
  }, [])

  const login = useCallback((email: string, password: string) => {
    const result = authService.loginWithCredentials(email, password)
    if (result.ok) setSession(result.session)
    return result
  }, [])

  const logout = useCallback(() => {
    authService.clearSession()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, loginClient, loginAdmin, login, logout }),
    [session, loginClient, loginAdmin, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
