'use client'

import { useState } from 'react'
import { SearchInput } from '@/components/shared/SearchInput'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Skeleton } from '@/components/ui/skeleton'
import { useFoodSearch } from '@/features/foods/hooks/use-foods'
import {
  scaleNutrition,
  servingAmountLabel,
  type FoodSummary,
} from '@/features/foods/types/food.types'
import { useDebounce } from '@/hooks/use-debounce'
import type { TileOptions } from '../../food-log-settings'
import type { AiIngredient, ResolvedIngredient } from '../../types/food-log.types'
import { FoodTile } from './FoodTile'

interface IngredientSearchSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Nguyên liệu AI chưa có dữ liệu cần thay bằng món user chọn. */
  readonly ingredient: AiIngredient
  readonly tileOptions: TileOptions
  readonly onSelect: (data: ResolvedIngredient) => void
}

/** Món được chọn → kết quả resolve cho đúng số gram AI ước lượng (macro tính từ giá trị trên 100 g, không làm tròn). */
const resolvedFrom = (food: FoodSummary, grams: number): ResolvedIngredient => {
  const perServing = Boolean(food.defaultServingId) && food.defaultServingGrams > 0
  const per = (value: number) => (value * grams) / 100
  return {
    matched: true,
    foodItemId: food.id,
    foodName: food.name,
    emoji: food.emoji ?? null,
    iconKey: food.iconKey ?? null,
    servingId: perServing ? food.defaultServingId : null,
    quantity: perServing ? grams / food.defaultServingGrams : grams,
    unitLabel: perServing ? food.defaultServingName : 'g',
    weightGrams: grams,
    calories: per(food.caloriesPer100g),
    protein: per(food.proteinPer100g),
    fat: per(food.fatPer100g),
    carbs: per(food.carbsPer100g),
    estimated: false,
  }
}

/**
 * Bảng "Search" thay món cho nguyên liệu AI không tìm được: ô tìm (điền sẵn tên nguyên liệu), kết quả theo thứ tự BE xếp, chọn một
 * món thì nguyên liệu dùng món đó với đúng số gram AI ước lượng (sửa tiếp được bằng ô lượng).
 */
export function IngredientSearchSheet({
  open,
  onOpenChange,
  ingredient,
  tileOptions,
  onSelect,
}: IngredientSearchSheetProps) {
  const [search, setSearch] = useState(ingredient.name)
  const query = useDebounce(search.trim(), 300)
  const results = useFoodSearch({ search: query || undefined, top: 20 }, open && query !== '')
  const items = results.data?.items ?? []

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      subtitle={`Replace “${ingredient.name}”`}
      showDone={false}
      tall
    >
      <div className="bg-popover sticky top-0 z-10 px-4 py-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search for a food"
          aria-label="Search foods"
        />
      </div>
      {results.isLoading ? (
        <div className="space-y-2 px-4" aria-busy="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-base">No matching foods</p>
      ) : (
        <ul className="divide-border divide-y">
          {items.map((food) => (
            <li key={food.id}>
              <FoodTile
                variant="row"
                food={{
                  name: food.brand ? `${food.name} (${food.brand})` : food.name,
                  highlight: query,
                  calories: scaleNutrition(food.caloriesPer100g, food.defaultServingGrams),
                  protein: scaleNutrition(food.proteinPer100g, food.defaultServingGrams),
                  fat: scaleNutrition(food.fatPer100g, food.defaultServingGrams),
                  carbs: scaleNutrition(food.carbsPer100g, food.defaultServingGrams),
                  servingText: food.defaultServingId
                    ? servingAmountLabel(1, food.defaultServingName)
                    : `${food.defaultServingGrams} g`,
                  weightText: `${Math.round(food.defaultServingGrams)} g`,
                  emoji: food.emoji ?? null,
                  iconKey: food.iconKey ?? null,
                }}
                // Chọn đúng một món: không có Multi-Add, không vẽ nút + tắt
                settings={
                  tileOptions.highlight === 'MultiAdd'
                    ? { ...tileOptions, highlight: 'None' }
                    : tileOptions
                }
                onSelect={() => {
                  onSelect(resolvedFrom(food, ingredient.grams))
                  onOpenChange(false)
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </SheetFrame>
  )
}
