import { Suspense, type ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { PageLoading } from '@/components/ui/LoadingState'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </AuthProvider>
    </MotionConfig>
  )
}
