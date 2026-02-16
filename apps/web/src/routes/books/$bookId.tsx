import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Download, Loader2, Trash2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { RecipeList } from '@/components/RecipeList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBook, useDeleteBook, useUpdateBook } from '@/hooks/use-books'
import { getExportUrl } from '@/lib/api'

export const Route = createFileRoute('/books/$bookId')({
  component: BookDetailPage,
})

function BookDetailPage() {
  const { bookId } = Route.useParams()
  const navigate = useNavigate()
  const { data: book, isLoading, isError } = useBook(bookId)
  const updateBook = useUpdateBook()
  const deleteMutation = useDeleteBook()

  const handleDelete = useCallback(() => {
    if (!window.confirm('Delete this book and all its recipes?')) return
    deleteMutation.mutate(bookId, {
      onSuccess: () => navigate({ to: '/' }),
    })
  }, [bookId, deleteMutation, navigate])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !book) {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <p className="text-destructive">Book not found</p>
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          Go home
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <EditableText
            value={book.title}
            onSave={(title) => updateBook.mutate({ id: bookId, data: { title } })}
            className="font-semibold text-lg"
          />
          <EditableText
            value={book.author ?? ''}
            placeholder="Add author..."
            onSave={(author) =>
              updateBook.mutate({ id: bookId, data: { author: author || null } })
            }
            className="text-sm text-muted-foreground"
          />
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            Recipes ({book.recipes.length})
          </h2>
          <div className="flex gap-2">
            <a href={getExportUrl(bookId)} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <RecipeList bookId={bookId} recipes={book.recipes} />
      </main>
    </div>
  )
}

// Inline editable text field
interface EditableTextProps {
  value: string
  placeholder?: string
  onSave: (value: string) => void
  className?: string
}

function EditableText({ value, placeholder, onSave, className }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback(() => {
    setEditValue(value)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [value])

  const save = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed !== value) {
      onSave(trimmed)
    }
    setIsEditing(false)
  }, [editValue, value, onSave])

  const cancel = useCallback(() => {
    setEditValue(value)
    setIsEditing(false)
  }, [value])

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') cancel()
        }}
        className={`h-auto px-1 py-0 border-0 border-b border-border rounded-none focus-visible:ring-0 ${className ?? ''}`}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={`block text-left hover:underline cursor-pointer ${className ?? ''}`}
    >
      {value || <span className="italic text-muted-foreground">{placeholder}</span>}
    </button>
  )
}
