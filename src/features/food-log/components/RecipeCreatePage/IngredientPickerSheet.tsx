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
import { FoodTile } from '../FoodLogPage/FoodTile'
import type { TileOptions } from '../../food-log-settings'

interface IngredientPickerSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly tileOptions: TileOptions
  /** Chọn một món: thêm làm nguyên liệu (khẩu phần mặc định, số lượng 1) rồi đóng bảng. */
  readonly onSelect: (food: FoodSummary) => void
}

/**
 * Bảng "Add Ingredient" của Create Recipe (như MacroFactor): ô tìm món ở đầu, kết quả theo thứ tự BE xếp; bấm một món là thêm vào công
 * thức. Mount mới mỗi lần mở (parent chỉ render khi mở).
 */
export function IngredientPickerSheet({
  open,
  onOpenChange,
  tileOptions,
  onSelect,
}: IngredientPickerSheetProps) {
  const [search, setSearch] = useState('')
  const query = useDebounce(search.trim(), 300)
  const results = useFoodSearch({ search: query || undefined, top: 25 }, open)
  const items = results.data?.items ?? []

  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Add Ingredient"
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
                  onSelect(food)
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
