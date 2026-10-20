'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { arrayMove } from '@dnd-kit/sortable'
import { ChooseIconSheet } from '@/components/shared/ChooseIconSheet'
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
  sanitizeNumberText,
} from '../components/RecipeCreatePage/IngredientEditorBar'
import { IngredientPickerSheet } from '../components/RecipeCreatePage/IngredientPickerSheet'
import {
  RecipeForm,
  type NumberField,
  type RecipeFormLine,
} from '../components/RecipeCreatePage/RecipeForm'
import { RecipeNutrition } from '../components/RecipeCreatePage/RecipeNutrition'
import {
  RecipePreparation,
  type RecipeStep,
} from '../components/RecipeCreatePage/RecipePreparation'
import { StepSheet } from '../components/RecipeCreatePage/StepSheet'
import { loggerTileOptions } from '../food-log-settings'
import { useCreateRecipe, useCreateRecipeAndLog, useRecipeNutrients } from '../hooks/use-food-log'
import { useFoodLogSettings } from '../hooks/use-food-log-settings'
import { gramsOfText, requestLineOf, switchIngredientUnit, unitsOf } from '../recipe.utils'
import { recipeSchema } from '../schemas/recipe.schema'
import type { CreateRecipeRequest } from '../types/food-log.types'

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

/** Mỗi trường bước 1: chỉ phần này được kiểm tra khi bấm Next. */
const STEP_ONE = recipeSchema.pick({
  name: true,
  servingsCount: true,
  ingredients: true,
  cookedYieldGrams: true,
})

const numberOrUndefined = (text: string) => (text.trim() === '' ? undefined : Number(text))

/**
 * Trang Create Recipe (như MacroFactor, hai bước, vạch tiến độ 1/2 dưới tiêu đề).
 * Bước 1 "Build your recipe": tên, số khẩu phần, tổng khối lượng (tuỳ chọn), nguyên liệu điền sẵn từ các món đã chọn trên timeline (hoặc
 * thêm bằng nút +; ô lượng dùng bàn phím số riêng với chip mọi đơn vị, đổi đơn vị giữ khối lượng) và mục Nutrition Serving | Recipe.
 * Bước 2 "Preparation (optional)": icon, thời gian chuẩn bị / nấu, link, mô tả, các bước. Create = `POST /recipes`; Create & Add =
 * `POST /recipes/create-and-log` (tạo xong ghi một khẩu phần vào hôm nay); xong quay lại Food Log.
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

  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [servings, setServings] = useState('1')
  const [weight, setWeight] = useState('')
  const [prep, setPrep] = useState('')
  const [cook, setCook] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [iconKey, setIconKey] = useState<string | null>(null)
  const [steps, setSteps] = useState<readonly RecipeStep[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [field, setField] = useState<NumberField | null>(null)
  const [error, setError] = useState<string | null>(null)
  const picker = useSheet<true>()
  const iconSheet = useSheet<true>()
  const stepSheet = useSheet<{ id: string | null }>()
  const createRecipe = useCreateRecipe()
  const createAndLog = useCreateRecipeAndLog()
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
  // Nguyên liệu đã hợp lệ (đủ chi tiết món và lượng > 0) cho phần Nutrition; thiếu một dòng thì chưa tính
  const requestLines = resolved.flatMap(({ line, unit, grams }) =>
    unit && Number.isFinite(grams) && grams > 0
      ? [{ foodItemId: line.foodItemId, ...requestLineOf(line.text, unit) }]
      : []
  )
  const servingsCount = Number(servings) >= 1 ? Number(servings) : 1
  const summary = useRecipeNutrients(
    { ingredients: requestLines, servingsCount },
    step === 2 && requestLines.length > 0
  ).data

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
  const closeEditor = () => {
    setEditingKey(null)
    setField(null)
  }
  const scrollToButton = (button: HTMLElement) =>
    // Bàn phím trượt lên che nửa dưới: giữ ô đang sửa trong vùng nhìn thấy
    window.setTimeout(() => button.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320)

  const fieldValue = { servings, weight, prep, cook }
  const setFieldValue = (which: NumberField, text: string) => {
    if (which === 'servings') setServings(sanitizeNumberText(text, false).slice(0, 3))
    else if (which === 'weight') setWeight(sanitizeNumberText(text, true).slice(0, 9))
    else if (which === 'prep') setPrep(sanitizeNumberText(text, false).slice(0, 4))
    else setCook(sanitizeNumberText(text, false).slice(0, 4))
  }

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

  const ingredientsReady = () => {
    if (resolved.some((item) => !item.unit)) {
      setError('Ingredients are still loading, try again in a moment')
      return false
    }
    return true
  }
  const ingredientsPayload = () =>
    resolved.map(({ line, unit }) => ({
      foodItemId: line.foodItemId,
      ...requestLineOf(line.text, unit!),
    }))

  const next = () => {
    setError(null)
    closeEditor()
    if (!ingredientsReady()) return
    const result = STEP_ONE.safeParse({
      name,
      servingsCount: Number(servings),
      ingredients: ingredientsPayload(),
      cookedYieldGrams: numberOrUndefined(weight),
    })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check the recipe')
      return
    }
    setStep(2)
    window.scrollTo({ top: 0 })
  }

  const save = (andAdd: boolean) => {
    setError(null)
    closeEditor()
    if (!ingredientsReady()) return
    const result = recipeSchema.safeParse({
      name,
      servingsCount: Number(servings),
      ingredients: ingredientsPayload(),
      cookedYieldGrams: numberOrUndefined(weight),
      prepTimeMinutes: numberOrUndefined(prep),
      cookTimeMinutes: numberOrUndefined(cook),
      sourceUrl: link.trim() || undefined,
      description: description.trim() || undefined,
      steps: steps.length ? steps.map((item) => ({ text: item.text })) : undefined,
      iconKey: iconKey ?? undefined,
    })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check the recipe')
      return
    }
    const recipe: CreateRecipeRequest = result.data
    const done = () => router.push(routePath.foodLog)
    if (andAdd) createAndLog.mutate({ recipe }, { onSuccess: done })
    else createRecipe.mutate(recipe, { onSuccess: done })
  }

  const pending = createAndLog.isPending ? 'add' : createRecipe.isPending ? 'create' : null
  const serverError = createAndLog.error ?? createRecipe.error
  const shownError = error ?? (serverError ? getFormErrorMessage(serverError) : null)
  const editorOpen = Boolean(editing) || field !== null
  const stepNumber = (id: string | null) =>
    id ? steps.findIndex((item) => item.id === id) + 1 : steps.length + 1

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-4 pb-8">
      <SubPageHeader
        title="Create Recipe"
        onBack={
          step === 2
            ? () => {
                closeEditor()
                setStep(1)
              }
            : undefined
        }
      />
      <div
        role="progressbar"
        aria-label="Recipe steps"
        aria-valuemin={1}
        aria-valuemax={2}
        aria-valuenow={step}
        className="bg-muted h-0.5 overflow-hidden rounded-full"
      >
        <div
          className="bg-foreground h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      <div
        key={step}
        className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:animation-duration-300"
      >
        {step === 1 ? (
          <RecipeForm
            name={name}
            onNameChange={setName}
            servings={servings}
            weight={weight}
            activeField={field}
            onFieldPress={(which, button) => {
              setEditingKey(null)
              setField(which)
              scrollToButton(button)
            }}
            lines={formLines}
            totalGrams={totalGrams}
            editingKey={editing ? editingKey : null}
            onEditLine={(key, button) => {
              setField(null)
              setEditingKey(key)
              scrollToButton(button)
            }}
            onRemoveLine={(key) => {
              if (editingKey === key) setEditingKey(null)
              setLines((current) => current.filter((line) => line.key !== key))
            }}
            onAddIngredient={() => {
              closeEditor()
              picker.show(true)
            }}
            onNameFocus={closeEditor}
            onNext={next}
            error={shownError}
            editorOpen={editorOpen}
            nutrition={<RecipeNutrition ingredients={requestLines} servingsCount={servingsCount} />}
          />
        ) : (
          <RecipePreparation
            name={name.trim()}
            macros={summary?.perServing ?? null}
            servingsLabel={`${servingsCount} serving${servingsCount === 1 ? '' : 's'}`}
            iconKey={iconKey}
            ingredientIcons={lines}
            onEditIcon={() => {
              closeEditor()
              iconSheet.show(true)
            }}
            prep={prep}
            cook={cook}
            activeField={field}
            onFieldPress={(which, button) => {
              setField(which)
              scrollToButton(button)
            }}
            link={link}
            onLinkChange={setLink}
            description={description}
            onDescriptionChange={setDescription}
            onTextFocus={closeEditor}
            steps={steps}
            onAddStep={() => {
              closeEditor()
              stepSheet.show({ id: null })
            }}
            onEditStep={(id) => {
              closeEditor()
              stepSheet.show({ id })
            }}
            onRemoveStep={(id) => setSteps((current) => current.filter((item) => item.id !== id))}
            onReorderSteps={(from, to) =>
              setSteps((current) =>
                from < 0 || to < 0 ? current : arrayMove([...current], from, to)
              )
            }
            onCreateAndAdd={() => save(true)}
            onCreate={() => save(false)}
            pending={pending}
            error={shownError}
            editorOpen={editorOpen}
          />
        )}
      </div>

      {editing?.unit && (
        <IngredientEditorBar
          units={editing.units}
          unitId={editing.unit.id}
          text={editing.line.text}
          valid={Number.isFinite(editing.grams) && editing.grams > 0}
          onText={(text) =>
            patch(editing.line.key, { text: sanitizeIngredientText(text), anchorGrams: undefined })
          }
          onUnit={(nextUnit) => {
            // Đổi qua lại nhiều đơn vị: tính từ khối lượng gốc để làm tròn không tích luỹ (2 large → 3.53 oz → 100 g, không phải 100.07)
            const grams =
              editing.line.anchorGrams ?? (Number.isFinite(editing.grams) ? editing.grams : 0)
            patch(editing.line.key, {
              unitId: nextUnit.id,
              anchorGrams: grams > 0 ? grams : undefined,
              text: switchIngredientUnit('', editing.unit!, nextUnit, grams > 0 ? grams : 100),
            })
          }}
          onDone={() => setEditingKey(null)}
        />
      )}
      {field && (
        <IngredientEditorBar
          fraction={false}
          text={fieldValue[field]}
          valid
          onText={(text) => setFieldValue(field, text)}
          onDone={() => setField(null)}
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
      {iconSheet.value && (
        <ChooseIconSheet
          key={iconSheet.id}
          open={iconSheet.open}
          onOpenChange={iconSheet.onOpenChange}
          value={iconKey}
          onSelect={setIconKey}
        />
      )}
      {stepSheet.value && (
        <StepSheet
          key={stepSheet.id}
          open={stepSheet.open}
          onOpenChange={stepSheet.onOpenChange}
          number={stepNumber(stepSheet.value.id)}
          initial={steps.find((item) => item.id === stepSheet.value?.id)?.text ?? ''}
          onSave={(text) => {
            const id = stepSheet.value?.id
            if (id) {
              setSteps((current) =>
                current.map((item) => (item.id === id ? { ...item, text } : item))
              )
            } else {
              nextKey.current += 1
              setSteps((current) => [...current, { id: `step-${nextKey.current}`, text }])
            }
          }}
        />
      )}
    </div>
  )
}
