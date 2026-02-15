import { Check, Pencil, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RecipeType } from '@cookbooks/schemas'

interface RecipeRowProps {
  recipe: RecipeType
  onUpdate: (id: string, data: { name: string }) => void
  onDelete: (id: string) => void
}

export function RecipeRow({ recipe, onUpdate, onDelete }: RecipeRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(recipe.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback(() => {
    setEditValue(recipe.name)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [recipe.name])

  const save = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== recipe.name) {
      onUpdate(recipe.id, { name: trimmed })
    }
    setIsEditing(false)
  }, [editValue, recipe.id, recipe.name, onUpdate])

  const cancel = useCallback(() => {
    setEditValue(recipe.name)
    setIsEditing(false)
  }, [recipe.name])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') save()
      if (e.key === 'Escape') cancel()
    },
    [save, cancel],
  )

  const pageLabel = recipe.pageStart
    ? recipe.pageEnd
      ? `pp. ${recipe.pageStart}–${recipe.pageEnd}`
      : `p. ${recipe.pageStart}`
    : null

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/50 group">
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            className="h-8"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onMouseDown={save}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={startEdit}
            className="flex-1 text-left flex items-center gap-2 min-w-0"
          >
            <span className="truncate">{recipe.name}</span>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
          </button>
          {pageLabel && (
            <span className="text-sm text-muted-foreground tabular-nums shrink-0">
              {pageLabel}
            </span>
          )}
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
        onClick={() => onDelete(recipe.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
