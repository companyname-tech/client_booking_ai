import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { BrandLogo } from '@/components/shell/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { homeForZone } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { spring } from '@/lib/motion'

export default function LoginPage() {
  const navigate = useNavigate()
  const { session, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) navigate(homeForZone(session.zone), { replace: true })
  }, [session, navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(username, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(homeForZone(result.session.zone), { replace: true })
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(124_156_255/0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-violet/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-1/4 size-96 rounded-full bg-accent/10 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo variant="full" height={28} />
          <h1 className="mt-6 text-2xl font-semibold text-fg">Welcome back</h1>
          <p className="mt-2 text-sm text-fg-muted">Sign in to your AI Booking Agent workspace</p>
        </div>

        <div className="surface p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-fg-secondary">Username</label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-fg-secondary">Password</label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-line bg-surface-1 px-4 py-3">
            <div className="flex items-center gap-2 text-2xs text-fg-muted">
              <Sparkles className="size-3.5 text-violet" />
              <span>Default credentials</span>
            </div>
            <p className="mt-2 text-xs text-fg-secondary">
              The default single-admin account is <span className="font-mono text-fg-muted">admin</span> /{' '}
              <span className="font-mono text-fg-muted">admin</span> (override via ADMIN_USERNAME / ADMIN_PASSWORD).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
