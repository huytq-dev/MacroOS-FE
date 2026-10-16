'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { scaleNutrition, type FoodDetail } from '@/features/foods/types/food.types'
import type { PlateItem } from '../../types/food-log.types'

interface FoodPickerProps {
  readonly food: FoodDetail
  readonly onBack: () => void
  readonly onAdd: (item: PlateItem) => void
}

const GRAM = ''

/** Chọn khẩu phần + số lượng, xem trước kcal/macro rồi thêm vào plate. Mount lại theo food.id (key ở cha). */
export function FoodPicker({ food, onBack, onAdd }: FoodPickerProps) {
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

  const add = () =>
    onAdd({
      key: `${food.id}-${Date.now()}`,
      foodItemId: food.id,
      name: food.name,
      foodServingId: serving?.id ?? null,
      servingLabel: serving ? `${quantityNumber} × ${serving.servingName}` : `${quantityNumber} g`,
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
        <ArrowLeft /> Kết quả
      </Button>
      <div>
        <h2 className="text-base font-semibold">{food.name}</h2>
        {food.brand && <p className="text-muted-foreground text-sm">{food.brand}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pick-serving">Khẩu phần</Label>
          <NativeSelect id="pick-serving" value={servingId} onChange={(event) => setServingId(event.target.value)}>
            {food.servings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.servingName} ({item.weightInGrams} g)
              </option>
            ))}
            <option value={GRAM}>Gram</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pick-quantity">{serving ? 'Số khẩu phần' : 'Số gram'}</Label>
          <Input id="pick-quantity" type="number" inputMode="decimal" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border py-2">
            <p className={`text-base font-semibold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-muted-foreground text-[11px]">{stat.label}</p>
          </div>
        ))}
      </div>
      <Button className="w-full" size="lg" disabled={!valid} onClick={add}>
        Thêm vào plate
      </Button>
    </div>
  )
}
