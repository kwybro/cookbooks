import { Link } from '@tanstack/react-router'
import { Book } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { BookType } from '@cookbooks/schemas'

interface BookCardProps {
  book: BookType
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link to="/books/$bookId" params={{ bookId: book.id }}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="flex flex-col items-center justify-center text-center p-6 gap-3">
          <div className="rounded-lg bg-muted p-3">
            <Book className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold leading-tight">{book.title}</p>
            {book.author && (
              <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
