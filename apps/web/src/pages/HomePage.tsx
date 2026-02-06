import { Plus } from 'lucide-react';
import { useState } from 'react';
import { BookCard } from '../components/BookCard';
import { BookForm } from '../components/BookForm';
import { SearchBar } from '../components/SearchBar';
import { SearchResults } from '../components/SearchResults';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { useBooks, useCreateBook, useDeleteBook } from '../hooks/useBooks';
import { useDebounce } from '../hooks/useDebounce';
import { useSearch } from '../hooks/useSearch';

export function HomePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, 300);

  const { data: books, isLoading: booksLoading, error: booksError } = useBooks();
  const createBook = useCreateBook();
  const deleteBook = useDeleteBook();
  const {
    data: searchResults,
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = useSearch(debouncedQuery);

  const isSearching = debouncedQuery.length >= 3;
  const showHint = searchInput.length > 0 && searchInput.length < 3;

  const handleCreateBook = async (data: { title: string; author?: string }) => {
    await createBook.mutateAsync(data);
    setIsDialogOpen(false);
  };

  const handleDeleteBook = (id: string) => {
    deleteBook.mutate({ id });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-6">What do you want to cook?</h1>
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          isLoading={searchFetching}
        />
        {showHint && (
          <p className="text-sm text-muted-foreground mt-2">
            Type at least 3 characters to search
          </p>
        )}
      </div>

      {/* Search Results or Book Grid */}
      {isSearching ? (
        searchLoading && !searchResults ? (
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : searchResults ? (
          <SearchResults results={searchResults} query={debouncedQuery} />
        ) : null
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">My Cookbooks</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Cookbook</DialogTitle>
                </DialogHeader>
                <BookForm onSubmit={handleCreateBook} isSubmitting={createBook.isPending} />
              </DialogContent>
            </Dialog>
          </div>

          {booksError ? (
            <div className="text-center text-destructive">
              <p>Failed to load books. Please try again.</p>
              <p className="text-sm mt-2">{booksError.message}</p>
            </div>
          ) : booksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : books && books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  onDelete={handleDeleteBook}
                  isDeleting={deleteBook.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">You don&apos;t have any cookbooks yet.</p>
              <Button onClick={() => setIsDialogOpen(true)}>Add Your First Book</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
