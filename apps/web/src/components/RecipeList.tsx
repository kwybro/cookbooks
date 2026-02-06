import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'

interface Recipe {
  id: string
  name: string
  pageStart: number | null
  pageEnd: number | null
}

interface RecipeListProps {
  recipes: Recipe[]
  isLoading?: boolean
}

export function RecipeList({ recipes, isLoading }: RecipeListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recipes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (recipes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recipes found. Upload and process an index image to extract recipes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipes ({recipes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {recipes.map((recipe) => (
            <li
              key={recipe.id}
              className="py-3 flex items-center justify-between"
            >
              <span className="font-medium">{recipe.name}</span>
              {recipe.pageStart && (
                <span className="text-sm text-muted-foreground">
                  p. {recipe.pageStart}
                  {recipe.pageEnd && recipe.pageEnd !== recipe.pageStart
                    ? `-${recipe.pageEnd}`
                    : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
