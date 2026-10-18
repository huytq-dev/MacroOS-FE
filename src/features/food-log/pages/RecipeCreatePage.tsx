'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { routePath } from '@/config/route-path'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { useFoodSearch } from '@/features/foods/hooks/use-foods'
import { useDebounce } from '@/hooks/use-debounce'
import { RecipeForm } from '../components/RecipeCreatePage'
import { useCreateRecipe } from '../hooks/use-food-log'
import { recipeSchema, type RecipeFormValues } from '../schemas/recipe.schema'

const FOODS_PAGE = 25

/** Tạo công thức tối giản: `POST /recipes` (BE tự tính dinh dưỡng), xong thì quay lại Food Log và làm mới thư viện. */
export function RecipeCreatePage() {
  const router = useRouter()
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { name: '', servingsCount: 1, ingredients: [] },
  })
  const ingredients = useFieldArray({ control: form.control, name: 'ingredients' })
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 300)
  const foods = useFoodSearch({
    search: debouncedSearch || undefined,
    scope: 'Mine',
    top: FOODS_PAGE,
  })
  const createRecipe = useCreateRecipe()

  const submit = form.handleSubmit((values) =>
    createRecipe.mutate(
      {
        name: values.name,
        servingsCount: values.servingsCount,
        ingredients: values.ingredients.map(({ foodItemId, foodServingId, quantity }) => ({
          foodItemId,
          foodServingId,
          quantity,
        })),
      },
      { onSuccess: () => router.push(routePath.foodLog) }
    )
  )

  return (
    <div className="flex max-w-2xl flex-col gap-6 pb-8">
      <SubPageHeader title="New recipe" />
      <RecipeForm
        form={form}
        ingredients={ingredients.fields}
        onRemoveIngredient={ingredients.remove}
        onAddIngredient={(food) => {
          if (!food.defaultServingId) return
          ingredients.append({
            foodItemId: food.id,
            foodServingId: food.defaultServingId,
            name: food.name,
            servingName: food.defaultServingName,
            quantity: 1,
          })
        }}
        search={search}
        onSearchChange={setSearch}
        foods={foods.data?.items ? [...foods.data.items] : []}
        isFoodsLoading={foods.isLoading}
        onSubmit={() => void submit()}
        isSubmitting={createRecipe.isPending}
        error={createRecipe.error ? getFormErrorMessage(createRecipe.error) : null}
      />
    </div>
  )
}
