import { Link } from '@tanstack/react-router'
import { BookOpen, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

interface BookCardProps {
  id: string
  title: string
  author?: string | null
  onDelete?: (id: string) => void
  isDeleting?: boolean
}

export function BookCard({ id, title, author, onDelete, isDeleting }: BookCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <Link to="/books/$bookId" params={{ bookId: id }} className="flex-1">
          <CardTitle className="text-lg font-semibold hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </Link>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              onDelete(id)
            }}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Link to="/books/$bookId" params={{ bookId: id }} className="block">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">{author ?? 'Unknown Author'}</span>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
