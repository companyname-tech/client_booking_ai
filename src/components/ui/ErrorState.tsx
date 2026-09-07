import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className ?? ''}`}>
      <div className="mb-4 flex size-11 items-center justify-center rounded-lg border border-danger/30 bg-danger/10 text-danger [&>svg]:size-5">
        <AlertTriangle />
      </div>
      <h3 className="text-md font-semibold text-fg">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-fg-muted">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
