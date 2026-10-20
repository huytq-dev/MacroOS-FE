'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { routePath } from '@/config/route-path'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { useFoodDetails } from '@/features/foods/hooks/use-foods'
import type { FoodSummary } from '@/features/foods/types/food.types'
import { useSheet } from '@/hooks/use-sheet'
import { useUiStore } from '@/stores/ui.store'
import {
  IngredientEditorBar,
  sanitizeIngredientText,
} from '../components/RecipeCreatePage/IngredientEditorBar'
import { IngredientPickerSheet } from '../components/RecipeCreatePage/IngredientPickerSheet'
import { RecipeForm, type RecipeFormLine } from '../components/RecipeCreatePage/RecipeForm'
import { loggerTileOptions } from '../food-log-settings'
import { useCreateRecipe } from '../hooks/use-food-log'
import { useFoodLogSettings } from '../hooks/use-food-log-settings'
import { gramsOfText, requestLineOf, switchIngredientUnit, unitsOf } from '../recipe.utils'
import { recipeSchema } from '../schemas/recipe.schema'

/** Một nguyên liệu đang soạn: món + đơn vị đang chọn (`g`, `oz`, `serving:<id>`…) + lượng đang gõ (cho phép "1 1/2"). */
interface Line {
  readonly key: string
  readonly foodItemId: string
  readonly name: string
  readonly iconKey?: string | null
  readonly emoji?: string | null
  readonly unitId: string
  readonly text: string
  /** Khối lượng (g) lúc vừa đổi đơn vị; xoá khi gõ lại lượng. */
  readonly anchorGrams?: number
}

/**
 * Trang Create Recipe (như MacroFactor "Build your recipe"): tên, số khẩu phần, nguyên liệu điền sẵn từ các món đã chọn trên timeline
 * (hoặc thêm bằng nút +), mỗi dòng sửa lượng bằng bàn phím số riêng với chip mọi đơn vị (đổi đơn vị giữ khối lượng). Lưu bằng
 * `POST /recipes` (khẩu phần thì gửi foodServingId + số khẩu phần, đơn vị khối lượng / thể tích thì gửi số gram), xong quay lại Food Log.
 */
export function RecipeCreatePage() {
  const router = useRouter()
  const [settings] = useFoodLogSettings()
  const clearDraft = useUiStore((state) => state.clearRecipeDraft)
  const nextKey = useRef(0)
  const [lines, setLines] = useState<readonly Line[]>(() =>
    (useUiStore.getState().recipeDraft ?? []).map((line, index) => ({
      key: `draft-${index}`,
      foodItemId: line.foodItemId,
      name: line.name,
      iconKey: line.iconKey,
      emoji: line.emoji,
      unitId: line.foodServingId ? `serving:${line.foodServingId}` : 'g',
      text: String(line.quantity),
    }))
  )
  // Bản nháp chỉ dùng một lần: dọn khỏi store ngay sau khi đọc
  useEffect(() => clearDraft(), [clearDraft])

  const [name, setName] = useState('')
  const [servings, setServings] = useState('1')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const picker = useSheet<true>()
  const createRecipe = useCreateRecipe()
  const details = useFoodDetails([...new Set(lines.map((line) => line.foodItemId))])

  const resolved = lines.map((line) => {
    const detail = details.byId[line.foodItemId]
    const units = detail ? unitsOf(detail) : []
    const unit = units.find((candidate) => candidate.id === line.unitId) ?? units[0]
    const grams = unit ? gramsOfText(line.text, unit) : Number.NaN
    return { line, detail, units, unit, grams }
  })
  const totalGrams = resolved.length
    ? resolved.reduce((sum, item) => sum + (Number.isFinite(item.grams) ? item.grams : 0), 0)
    : null

  const formLines: RecipeFormLine[] = resolved.map(({ line, detail, unit, grams }) => {
    const known = Number.isFinite(grams) ? grams : 0
    const per = (per100g: number) => (per100g * known) / 100
    return {
      key: line.key,
      name: line.name,
      iconKey: line.iconKey,
      emoji: line.emoji,
      text: line.text,
      unitLabel: unit?.label ?? '',
      macros:
        detail && unit
          ? {
              calories: per(detail.nutrition.caloriesPer100g),
              protein: per(detail.nutrition.proteinPer100g),
              fat: per(detail.nutrition.fatPer100g),
              carbs: per(detail.nutrition.carbsPer100g),
              grams: Number.isFinite(grams) ? grams : null,
            }
          : null,
    }
  })

  const editing = resolved.find((item) => item.line.key === editingKey)
  const patch = (key: string, change: Partial<Line>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...change } : line)))

  const addFood = (food: FoodSummary) => {
    nextKey.current += 1
    setLines((current) => [
      ...current,
      {
        key: `added-${nextKey.current}`,
        foodItemId: food.id,
        name: food.name,
        iconKey: food.iconKey,
        emoji: food.emoji,
        unitId: food.defaultServingId ? `serving:${food.defaultServingId}` : 'g',
        text: food.defaultServingId ? '1' : '100',
      },
    ])
  }

  const submit = () => {
    setValidationError(null)
    if (resolved.some((item) => !item.unit)) {
      setValidationError('Ingredients are still loading, try again in a moment')
      return
    }
    const result = recipeSchema.safeParse({
      name,
      servingsCount: Number(servings),
      ingredients: resolved.map(({ line, unit }) => ({
        foodItemId: line.foodItemId,
        ...requestLineOf(line.text, unit!),
      })),
    })
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Check the recipe')
      return
    }
    createRecipe.mutate(result.data, { onSuccess: () => router.push(routePath.foodLog) })
  }

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-6 pb-8">
      <SubPageHeader title="Create Recipe" />
      <RecipeForm
        name={name}
        onNameChange={setName}
        servings={servings}
        onServingsChange={setServings}
        lines={formLines}
        totalGrams={totalGrams}
        editingKey={editing ? editingKey : null}
        onEditLine={(key, button) => {
          setEditingKey(key)
          // Bàn phím trượt lên che nửa dưới: giữ dòng đang sửa trong vùng nhìn thấy
          window.setTimeout(
            () => button.scrollIntoView({ block: 'center', behavior: 'smooth' }),
            320
          )
        }}
        onRemoveLine={(key) => {
          if (editingKey === key) setEditingKey(null)
          setLines((current) => current.filter((line) => line.key !== key))
        }}
        onAddIngredient={() => {
          setEditingKey(null)
          picker.show(true)
        }}
        onTextFocus={() => setEditingKey(null)}
        onSubmit={submit}
        isSubmitting={createRecipe.isPending}
        error={
          validationError ?? (createRecipe.error ? getFormErrorMessage(createRecipe.error) : null)
        }
        editorOpen={Boolean(editing)}
      />

      {editing?.unit && (
        <IngredientEditorBar
          units={editing.units}
          unitId={editing.unit.id}
          text={editing.line.text}
          valid={Number.isFinite(editing.grams) && editing.grams > 0}
          onText={(text) =>
            patch(editing.line.key, { text: sanitizeIngredientText(text), anchorGrams: undefined })
          }
          onUnit={(next) => {
            // Đổi qua lại nhiều đơn vị: tính từ khối lượng gốc để làm tròn không tích luỹ (2 large → 3.53 oz → 100 g, không phải 100.07)
            const grams =
              editing.line.anchorGrams ?? (Number.isFinite(editing.grams) ? editing.grams : 0)
            patch(editing.line.key, {
              unitId: next.id,
              anchorGrams: grams > 0 ? grams : undefined,
              text: switchIngredientUnit('', editing.unit!, next, grams > 0 ? grams : 100),
            })
          }}
          onDone={() => setEditingKey(null)}
        />
      )}

      {picker.value && (
        <IngredientPickerSheet
          key={picker.id}
          open={picker.open}
          onOpenChange={picker.onOpenChange}
          tileOptions={loggerTileOptions(settings)}
          onSelect={addFood}
        />
      )}
    </div>
  )
}
