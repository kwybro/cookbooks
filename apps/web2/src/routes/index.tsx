import { Link, createFileRoute } from '@tanstack/react-router'
import { Loader2, Plus } from 'lucide-react'

import { BookCard } from '@/components/BookCard'
import { SearchBar } from '@/components/SearchBar'
import { Button } from '@/components/ui/button'
import { useBooks } from '@/hooks/use-books'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data: books, isLoading } = useBooks()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex flex-col items-center gap-6 px-4 pt-12 pb-8">
        <h1 className="text-3xl font-bold">Cookbooks</h1>
        <SearchBar />
      </header>

      <main className="flex-1 px-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : books && books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-4">No cookbooks yet.</p>
            <Link to="/scan">
              <Button>Scan your first cookbook</Button>
            </Link>
          </div>
        )}
      </main>

      <Link
        to="/scan"
        className="fixed bottom-6 right-6 z-20"
      >
        <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  )
}
