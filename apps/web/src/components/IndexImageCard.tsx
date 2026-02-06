import { Play } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { ProcessingStatus } from './ProcessingStatus'

interface IndexImageCardProps {
  id: string
  r2Key: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date | string
  onProcess?: (id: string) => void
  isProcessing?: boolean
}

export function IndexImageCard({
  id,
  r2Key,
  status,
  createdAt,
  onProcess,
  isProcessing,
}: IndexImageCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const filename = r2Key.split('/').pop() ?? r2Key

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{filename}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>

          <div className="flex items-center gap-2">
            <ProcessingStatus status={status} />
            {status === 'pending' && onProcess && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onProcess(id)}
                disabled={isProcessing}
                className="flex items-center gap-1"
              >
                <Play className="h-3 w-3" />
                Process
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
