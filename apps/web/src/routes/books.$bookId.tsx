import { createFileRoute } from '@tanstack/react-router'
import { BookPage } from '../pages/BookPage'

export const Route = createFileRoute('/books/$bookId')({
  component: BookPageWrapper,
})

function BookPageWrapper() {
  const { bookId } = Route.useParams()
  return <BookPage bookId={bookId} />
}
