'use client'

import { useState } from 'react'
import { ArrowLeft, Heart } from 'lucide-react'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FavoriteFood } from '@/features/foods/types/favorite.types'
import {
  scaleNutrition,
  servingAmountLabel,
  type FoodDetail,
} from '@/features/foods/types/food.types'
import { cn } from '@/lib/utils'
import type { PlateItem } from '../../types/food-log.types'

interface FoodPickerProps {
  readonly food: FoodDetail
  readonly onBack: () => void
  readonly onAdd: (item: PlateItem) => void
  /** Preset yêu thích đã lưu của riêng món này. */
  readonly favorites: readonly FavoriteFood[]
  readonly isFavoritePending: boolean
  readonly onAddFavorite: (servingId: string | null, quantity: number) => void
  readonly onRemoveFavorite: (id: string) => void
}

// Khoá dòng plate phải khác nhau mỗi lần thêm (cùng món thêm nhiều lần); gọi trong sự kiện bấm.
const newPlateKey = (foodId: string) => `${foodId}-${Date.now()}`

// Radix Select không nhận value rỗng → dùng sentinel cho "Gram"
const GRAM = 'gram'

/** Chọn khẩu phần + số lượng, xem trước kcal/macro rồi thêm vào plate. Mount lại theo food.id (key ở cha). */
export function FoodPicker({
  food,
  onBack,
  onAdd,
  favorites,
  isFavoritePending,
  onAddFavorite,
  onRemoveFavorite,
}: FoodPickerProps) {
  const defaultServing = food.servings.find((serving) => serving.isDefault) ?? food.servings[0]
  const [servingId, setServingId] = useState(defaultServing?.id ?? GRAM)
  const [quantity, setQuantity] = useState(defaultServing ? '1' : '100')

  const serving = food.servings.find((item) => item.id === servingId)
  const quantityNumber = Number(quantity)
  const valid = quantityNumber >= 0.01 && quantityNumber <= 10000
  const grams = valid ? quantityNumber * (serving?.weightInGrams ?? 1) : 0
  const preview = {
    calories: scaleNutrition(food.nutrition.caloriesPer100g, grams),
    protein: scaleNutrition(food.nutrition.proteinPer100g, grams),
    carbs: scaleNutrition(food.nutrition.carbsPer100g, grams),
    fat: scaleNutrition(food.nutrition.fatPer100g, grams),
  }

  // Yêu thích gắn với đúng (khẩu phần, số lượng) đang chọn: cùng món lưu được nhiều preset.
  const favorite = valid
    ? favorites.find(
        (item) => item.foodServingId === (serving?.id ?? null) && item.quantity === quantityNumber
      )
    : undefined
  const toggleFavorite = () => {
    if (isFavoritePending || !valid) return
    if (favorite) onRemoveFavorite(favorite.id)
    else onAddFavorite(serving?.id ?? null, quantityNumber)
  }

  const add = () =>
    onAdd({
      key: newPlateKey(food.id),
      foodItemId: food.id,
      name: food.name,
      foodServingId: serving?.id ?? null,
      servingLabel: serving
        ? servingAmountLabel(quantityNumber, serving.servingName)
        : `${quantityNumber} g`,
      quantity: quantityNumber,
      ...preview,
    })

  const stats: { label: string; value: number; color: string }[] = [
    { label: 'kcal', value: preview.calories, color: 'text-mf-calories' },
    { label: 'Protein', value: preview.protein, color: 'text-mf-protein' },
    { label: 'Carbs', value: preview.carbs, color: 'text-mf-carbs' },
    { label: 'Fat', value: preview.fat, color: 'text-mf-fat' },
  ]

  return (
    <div className="space-y-4 p-4">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
        <ArrowLeft aria-hidden="true" /> Results
      </Button>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg leading-snug font-semibold md:text-base">{food.name}</h2>
          {food.brand && <p className="text-muted-foreground text-sm">{food.brand}</p>}
        </div>
        <button
          type="button"
          aria-pressed={Boolean(favorite)}
          aria-label={favorite ? 'Remove from favorites' : 'Save to favorites with this serving'}
          disabled={!valid || isFavoritePending}
          onClick={toggleFavorite}
          className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
        >
          <Heart
            aria-hidden="true"
            className={cn(
              'size-5 transition-colors',
              favorite && 'fill-mf-calories text-mf-calories'
            )}
          />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Serving">
          {(field) => (
            <Select value={servingId} onValueChange={setServingId}>
              <SelectTrigger id={field.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" position="popper" sideOffset={4}>
                {food.servings.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.servingName} ({item.weightInGrams} g)
                  </SelectItem>
                ))}
                <SelectItem value={GRAM}>Gram</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FormField>
        <FormField
          label={serving ? 'Servings' : 'Grams'}
          error={valid ? undefined : 'Enter a value from 0.01 to 10000'}
        >
          {(field) => (
            <Input
              {...field}
              type="number"
              inputMode="decimal"
              step="0.1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          )}
        </FormField>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-secondary rounded-xl py-2">
            <p className={`text-base font-semibold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-muted-foreground text-[11px]">{stat.label}</p>
          </div>
        ))}
      </div>
      <Button className="w-full" size="lg" disabled={!valid} onClick={add}>
        Add to plate
      </Button>
    </div>
  )
}
