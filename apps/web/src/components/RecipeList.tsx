import { useDeleteRecipe, useUpdateRecipe } from '@/hooks/use-recipes'
import { RecipeRow } from '@/components/RecipeRow'
import type { RecipeType } from '@cookbooks/schemas'

interface RecipeListProps {
  bookId: string
  recipes: RecipeType[]
}

export function RecipeList({ bookId, recipes }: RecipeListProps) {
  const updateRecipe = useUpdateRecipe(bookId)
  const deleteRecipe = useDeleteRecipe(bookId)

  if (recipes.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No recipes found in this book.
      </p>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {recipes.map((recipe) => (
        <RecipeRow
          key={recipe.id}
          recipe={recipe}
          onUpdate={(id, data) => updateRecipe.mutate({ id, data })}
          onDelete={(id) => deleteRecipe.mutate(id)}
        />
      ))}
    </div>
  )
}
