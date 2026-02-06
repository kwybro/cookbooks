import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'pending' | 'processing' | 'completed' | 'failed'

interface ProcessingStatusProps {
  status: Status
  className?: string
}

const statusConfig: Record<
  Status,
  { icon: React.ComponentType<{ className?: string }>; label: string; className: string }
> = {
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'text-muted-foreground bg-muted',
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    className: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    className: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    className: 'text-destructive bg-destructive/10',
  },
}

export function ProcessingStatus({ status, className }: ProcessingStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon
        className={cn('h-3.5 w-3.5', status === 'processing' && 'animate-spin')}
      />
      {config.label}
    </span>
  )
}
