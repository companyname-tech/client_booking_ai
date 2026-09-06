import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { BrandLogo } from '@/components/shell/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { demoUsers } from '@/config/demo-users'
import { homeForZone } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { spring } from '@/lib/motion'

export default function LoginPage() {
  const navigate = useNavigate()
  const { session, login, loginClient, loginAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) navigate(homeForZone(session.zone), { replace: true })
  }, [session, navigate])

  const finish = (zone: 'client' | 'admin') => {
    navigate(homeForZone(zone), { replace: true })
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = login(email, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    finish(result.session.zone)
  }

  const quickClient = () => {
    setError('')
    loginClient()
    finish('client')
  }

  const quickAdmin = () => {
    setError('')
    loginAdmin()
    finish('admin')
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
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-fg-secondary">Email</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-2xs text-fg-muted">or quick access</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start"
              leadingIcon={<Building2 className="size-4 text-accent" />}
              onClick={quickClient}
            >
              Login as Client
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start"
              leadingIcon={<ShieldCheck className="size-4 text-violet" />}
              onClick={quickAdmin}
            >
              Login as Super Admin
            </Button>
          </div>

          <div className="mt-6 rounded-lg border border-line bg-surface-1 px-4 py-3">
            <div className="flex items-center gap-2 text-2xs text-fg-muted">
              <Sparkles className="size-3.5 text-violet" />
              <span>Demo credentials</span>
            </div>
            <dl className="mt-2 space-y-1 text-xs text-fg-secondary">
              <div className="flex justify-between gap-4">
                <dt>Client</dt>
                <dd className="text-right font-mono text-fg-muted">{demoUsers.client.email} / {demoUsers.client.password}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Super Admin</dt>
                <dd className="text-right font-mono text-fg-muted">{demoUsers.admin.email} / {demoUsers.admin.password}</dd>
              </div>
            </dl>
          </div>
        </div>

        <p className="mt-6 text-center text-2xs text-fg-faint">
          Frontend demo — no real authentication. Session persists until you sign out.
        </p>
      </motion.div>
    </div>
  )
}
