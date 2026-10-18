'use client'

import { ListFilter, Loader2, Plus, X } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SearchInput } from '@/components/shared/SearchInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { FoodSummary } from '@/features/foods/types/food.types'
import type { RecipeFormValues } from '../../schemas/recipe.schema'

const FIELD_ERROR = 'text-destructive text-sm'

interface RecipeFormProps {
  readonly form: UseFormReturn<RecipeFormValues>
  /** Nguyên liệu đã chọn (`useFieldArray().fields`, `id` là khoá của react-hook-form). */
  readonly ingredients: readonly (RecipeFormValues['ingredients'][number] & { id: string })[]
  readonly onRemoveIngredient: (index: number) => void
  readonly onAddIngredient: (food: FoodSummary) => void
  readonly search: string
  readonly onSearchChange: (value: string) => void
  readonly foods: FoodSummary[]
  readonly isFoodsLoading: boolean
  readonly onSubmit: () => void
  readonly isSubmitting: boolean
  readonly error: string | null
}

/**
 * Form tạo công thức tối giản: tên, số khẩu phần, nguyên liệu chọn từ món tự tạo (mỗi dòng có số khẩu phần của món). Ô tìm món
 * nằm ngoài `<form>` để phím Enter trong ô tìm không gửi form; nút Lưu dính đáy, trên thanh tab.
 */
export function RecipeForm({
  form,
  ingredients,
  onRemoveIngredient,
  onAddIngredient,
  search,
  onSearchChange,
  foods,
  isFoodsLoading,
  onSubmit,
  isSubmitting,
  error,
}: RecipeFormProps) {
  const { register, formState } = form
  const errors = formState.errors
  return (
    <div className="flex flex-col gap-6">
      <form id="recipe-form" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormErrorAlert title="Couldn't save the recipe" message={error} />

        <div className="space-y-2">
          <Label htmlFor="recipe-name" className="text-base">
            Name
          </Label>
          <Input
            id="recipe-name"
            autoComplete="off"
            placeholder="e.g. Chicken fried rice"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name && <p className={FIELD_ERROR}>{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipe-servings" className="text-base">
            Servings
          </Label>
          <Input
            id="recipe-servings"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            aria-invalid={Boolean(errors.servingsCount)}
            {...register('servingsCount', { valueAsNumber: true })}
          />
          {errors.servingsCount && <p className={FIELD_ERROR}>{errors.servingsCount.message}</p>}
        </div>

        <section aria-label="Ingredients" className="space-y-3">
          <h2 className="text-xl font-bold">Ingredients</h2>
          {ingredients.length === 0 ? (
            <p className="text-muted-foreground bg-card rounded-xl px-4 py-4 text-sm">
              No ingredients yet. Add foods from the list below.
            </p>
          ) : (
            <ul className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <li key={ingredient.id} className="bg-card rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base leading-snug">{ingredient.name}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        × {ingredient.servingName}
                      </p>
                    </div>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      aria-label={`${ingredient.name} amount`}
                      aria-invalid={Boolean(errors.ingredients?.[index]?.quantity)}
                      className="w-24 text-center"
                      {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${ingredient.name}`}
                      onClick={() => onRemoveIngredient(index)}
                      className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    >
                      <X aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                  {errors.ingredients?.[index]?.quantity && (
                    <p className={FIELD_ERROR}>{errors.ingredients[index].quantity.message}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {errors.ingredients?.message && (
            <p className={FIELD_ERROR}>{errors.ingredients.message}</p>
          )}
        </section>
      </form>

      <section aria-label="Add ingredients" className="space-y-3">
        <h2 className="text-xl font-bold">Add ingredients</h2>
        <SearchInput
          icon={ListFilter}
          value={search}
          onValueChange={onSearchChange}
          placeholder="Filter your foods"
          aria-label="Filter your foods"
        />
        {isFoodsLoading ? (
          <div className="space-y-1" aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : foods.length === 0 ? (
          <p className="text-muted-foreground bg-card rounded-xl px-4 py-4 text-sm">
            {search.trim() ? 'No foods match your filter' : 'You have no custom foods yet'}
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {foods.map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  disabled={!food.defaultServingId}
                  onClick={() => onAddIngredient(food)}
                  className="focus-visible:ring-ring/50 active:bg-secondary flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base leading-snug">{food.name}</span>
                    <span className="text-muted-foreground block truncate text-sm">
                      {food.defaultServingId ? food.defaultServingName : 'No serving to count in'}
                    </span>
                  </span>
                  <Plus aria-hidden="true" className="size-5 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="bg-background sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 -mx-4 px-4 pt-2 pb-3">
        <Button
          type="submit"
          form="recipe-form"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="h-12 w-full rounded-full text-base"
        >
          {isSubmitting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save recipe'}
        </Button>
      </div>
    </div>
  )
}
