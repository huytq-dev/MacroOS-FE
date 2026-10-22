'use client'

import { useEffect, useState } from 'react'
import type { FavoriteFood } from '@/features/foods/types/favorite.types'
import { servingAmountLabel, type FoodDetail } from '@/features/foods/types/food.types'
import type { PlateItem } from '../../../types/food-log.types'
import { DetailActions } from './DetailActions'
import { FoodDetailHeader } from './FoodDetailHeader'
import { goalPercent, type NutrientGoal } from '@/features/nutrition/goal-progress'
import { FoodMacroRow } from './FoodMacroRow'
import { ImpactRings, type ImpactItem } from './ImpactRings'
import { NutrientSections } from './NutrientSections'
import { QuantityBar } from './QuantityBar'
import {
  gramsForNutrient,
  gramsOf,
  macroShares,
  nutrientPer100g,
  parseQuantity,
  quantityOf,
  scaledNutrients,
  type EntryMode,
  type MacroKey,
  type QuantityUnit,
} from './food-detail.utils'
import { roundTo } from '@/lib/units'

interface FoodDetailViewProps {
  readonly food: FoodDetail
  readonly onBack: () => void
  readonly onAdd: (item: PlateItem) => void
  /** Preset yêu thích đã lưu của riêng món này. */
  readonly favorites: readonly FavoriteFood[]
  readonly isFavoritePending: boolean
  readonly onAddFavorite: (servingId: string | null, quantity: number) => void
  readonly onRemoveFavorite: (id: string) => void
  /** Mục tiêu hiệu lực theo khoá danh mục (từ `GET /foods/{id}/nutrients`); null / thiếu = "No Target". */
  readonly goals: Readonly<Record<string, NutrientGoal>>
  readonly isTargetsLoading: boolean
  readonly isLogging: boolean
  /** Thêm món vào plate rồi ghi cả plate. */
  readonly onLogFoods: (item: PlateItem) => void
  readonly onCopyToCustom: (food: FoodDetail) => void
  readonly isCopyPending: boolean
  /** Có = sửa một món đã log (X thay mũi tên, thêm nút Remove, thanh đáy chỉ còn Done). */
  readonly edit?: FoodDetailEdit
}

/** Sửa món đã log: lượng ban đầu của dòng log, xoá, và lưu (Done) với khẩu phần + số lượng đang chọn (`servingId` null = gram). */
export interface FoodDetailEdit {
  readonly initialServingId: string | null
  readonly initialQuantity: number
  readonly onRemove: () => void
  readonly onDone: (change: { servingId: string | null; quantity: number }) => void
  /** Báo lên cha mỗi khi lượng đang chọn đổi (cha có thêm nút Done riêng ở đầu màn và cần giá trị mới nhất). */
  readonly onChange: (change: {
    servingId: string | null
    quantity: number
    valid: boolean
  }) => void
  readonly isSaving: boolean
  /** Hiện chip g / oz ở thanh đáy; false cho dòng không rõ khối lượng (Quick Add / AI) — chỉ còn chip "serving". Mặc định true. */
  readonly weightUnits?: boolean
}

/** Phần của Food Detail do trang quyết định (mục tiêu từ BE, ghi log, sao chép thành món tự tạo). */
export type FoodDetailExtras = Pick<
  FoodDetailViewProps,
  'goals' | 'isTargetsLoading' | 'isLogging' | 'onLogFoods' | 'onCopyToCustom' | 'isCopyPending'
>

const RINGS = [
  { key: 'calories', label: 'Calories', stroke: 'stroke-mf-tile-calories' },
  { key: 'protein', label: 'Protein', stroke: 'stroke-mf-tile-protein' },
  { key: 'fat', label: 'Fat', stroke: 'stroke-mf-tile-fat' },
  { key: 'carbs', label: 'Carbs', stroke: 'stroke-mf-tile-carbs' },
] as const

// Khoá dòng plate phải khác nhau mỗi lần thêm (cùng món thêm nhiều lần); gọi trong sự kiện bấm.
const newPlateKey = (foodId: string) => `${foodId}-${Date.now()}`

/**
 * Màn Food Detail kiểu MacroFactor, chiếm hết khung bảng Thêm món: đầu trang, hàng calo + macro, To Custom / Favorite, Impact on
 * Targets, các nhóm chất và thanh đáy chọn lượng. Lượng ăn tính theo khẩu phần, gram hoặc oz; mọi con số suy từ gram đang chọn
 * nên đổi số lượng là cập nhật ngay. Mount lại theo food.id (key ở cha).
 */
export function FoodDetailView({
  food,
  onBack,
  onAdd,
  favorites,
  isFavoritePending,
  onAddFavorite,
  onRemoveFavorite,
  goals,
  isTargetsLoading,
  isLogging,
  onLogFoods,
  onCopyToCustom,
  isCopyPending,
  edit,
}: FoodDetailViewProps) {
  const defaultServing = food.servings.find((item) => item.isDefault) ?? food.servings[0]
  // Sửa món đã log: bắt đầu từ khẩu phần + số lượng của dòng log (không có khẩu phần = gram)
  const loggedServing = edit?.initialServingId
    ? food.servings.find((item) => item.id === edit.initialServingId)
    : undefined
  const initialServing = loggedServing ?? defaultServing
  const initialUnit: QuantityUnit = edit
    ? loggedServing
      ? 'serving'
      : 'g'
    : defaultServing
      ? 'serving'
      : 'g'
  const initialQuantity = edit ? String(edit.initialQuantity) : defaultServing ? '1' : '100'
  const [servingId, setServingId] = useState(initialServing?.id ?? '')
  const [unit, setUnit] = useState<QuantityUnit>(initialUnit)
  const [quantity, setQuantity] = useState(initialQuantity)
  // Khối lượng thật (g) của lượng đang nhập, giữ chính xác qua mọi lần đổi đơn vị: số hiển thị làm tròn 2 số lẻ nên không dùng để quy
  // đổi ngược (3.84 oz sẽ không về đúng 109 g). Cập nhật khi gõ số hợp lệ, đổi khẩu phần, gõ calo/macro; đang gõ dở hoặc rỗng thì giữ
  // khối lượng hợp lệ gần nhất để đổi chip vẫn quy đổi được.
  const [mass, setMass] = useState(() => {
    const start = gramsOf(
      parseQuantity(initialQuantity),
      initialUnit,
      initialServing?.weightInGrams ?? 0
    )
    return Number.isFinite(start) ? start : 0
  })
  const [entryMode, setEntryMode] = useState<EntryMode>('amount')
  const [macroKey, setMacroKey] = useState<MacroKey>('calories')
  const [macroText, setMacroText] = useState('')

  const serving = food.servings.find((item) => item.id === servingId)
  const quantityNumber = parseQuantity(quantity)
  const grams = Number.isFinite(quantityNumber)
    ? gramsOf(quantityNumber, unit, serving?.weightInGrams ?? 0)
    : 0
  // BE lưu Quantity 2 số lẻ (HasPrecision(8,2)): làm tròn trước khi kiểm, gửi và so với yêu thích, để "1/3" không gửi 0.3333… rồi sửa lại lệch ~1%
  const logQuantity = roundTo(unit === 'serving' ? quantityNumber : grams, 2)
  const valid = Number.isFinite(quantityNumber) && logQuantity >= 0.01 && logQuantity <= 10000
  const shownGrams = valid ? grams : 0

  /** Gõ số lượng: nếu hợp lệ thì ghi lại khối lượng thật tương ứng (xem `mass`). */
  const changeQuantity = (text: string) => {
    setQuantity(text)
    const typed = parseQuantity(text)
    if (Number.isFinite(typed) && typed > 0)
      setMass(gramsOf(typed, unit, serving?.weightInGrams ?? 0))
  }

  /**
   * Đổi đơn vị / khẩu phần: số hiển thị luôn quy đổi từ khối lượng thật (100 g → 3.53 oz → 100 g) kể cả khi ô đang trống hoặc gõ dở
   * ("1/"); chỉ đổi giữa hai khẩu phần thật thì giữ số lượng và khối lượng đổi theo cỡ.
   */
  const switchTo = (nextUnit: QuantityUnit, nextServingId = servingId) => {
    const nextServing = food.servings.find((item) => item.id === nextServingId)
    if (nextUnit === 'serving' && !nextServing) return
    const nextServingGrams = nextServing?.weightInGrams ?? 0
    if (unit === 'serving' && nextUnit === 'serving') {
      if (valid) setMass(quantityNumber * nextServingGrams)
    } else if (mass > 0) {
      setQuantity(String(roundTo(quantityOf(mass, nextUnit, nextServingGrams), 2)))
    }
    setUnit(nextUnit)
    setServingId(nextServingId)
  }

  const per100gOf = (key: string) => nutrientPer100g(food, key) ?? 0
  const per = (key: string) => (per100gOf(key) * shownGrams) / 100

  /** Số calo / gram macro của lượng đang chọn, làm tròn 1 số lẻ: giá trị khởi đầu của ô ở chế độ macro. */
  const macroTextFor = (key: MacroKey) => String(roundTo(per(key), 1))
  const switchMode = (next: EntryMode) => {
    if (next === 'macro') setMacroText(macroTextFor(macroKey))
    setEntryMode(next)
  }
  const switchMacro = (key: MacroKey) => {
    setMacroKey(key)
    setMacroText(macroTextFor(key))
  }
  /** Gõ số calo / macro muốn ăn thì suy ra gram rồi đổi sang lượng theo đơn vị đang chọn (món không có chất đó thì bỏ qua). */
  const enterMacro = (text: string) => {
    setMacroText(text)
    const amount = Number(text)
    const needed =
      Number.isFinite(amount) && amount >= 0 ? gramsForNutrient(amount, per100gOf(macroKey)) : null
    if (needed === null) return
    if (text.trim() !== '') setMass(needed)
    setQuantity(
      text.trim() === ''
        ? ''
        : String(roundTo(quantityOf(needed, unit, serving?.weightInGrams ?? 0), 2))
    )
  }
  const macroAvailable: Record<MacroKey, boolean> = {
    calories: per100gOf('calories') > 0,
    protein: per100gOf('protein') > 0,
    fat: per100gOf('fat') > 0,
    carbs: per100gOf('carbs') > 0,
  }

  const calories = per('calories')
  const protein = per('protein')
  const fat = per('fat')
  const carbs = per('carbs')

  // Yêu thích gắn với đúng (khẩu phần, số lượng) đang chọn: cùng món lưu được nhiều preset.
  const favoriteServingId = unit === 'serving' ? (serving?.id ?? null) : null
  const favorite = valid
    ? favorites.find(
        (item) => item.foodServingId === favoriteServingId && item.quantity === logQuantity
      )
    : undefined
  const onEditChange = edit?.onChange
  useEffect(() => {
    onEditChange?.({ servingId: favoriteServingId, quantity: logQuantity, valid })
  }, [onEditChange, favoriteServingId, logQuantity, valid])

  const toggleFavorite = () => {
    if (isFavoritePending || !valid) return
    if (favorite) onRemoveFavorite(favorite.id)
    else onAddFavorite(favoriteServingId, logQuantity)
  }

  const buildItem = (): PlateItem => ({
    key: newPlateKey(food.id),
    foodItemId: food.id,
    name: food.name,
    foodServingId: favoriteServingId,
    servingLabel:
      unit === 'serving' && serving
        ? servingAmountLabel(quantityNumber, serving.servingName)
        : `${roundTo(grams, 1)} g`,
    quantity: logQuantity,
    // Không làm tròn: plate cộng số thật rồi chỉ làm tròn khi hiển thị (BE cộng theo 2 số lẻ, không theo số nguyên từng dòng)
    calories,
    protein,
    carbs,
    fat,
    nutrients: scaledNutrients(food, shownGrams),
    emoji: food.emoji ?? null,
    iconKey: food.iconKey ?? null,
    // Khối lượng thật (không làm tròn): sửa lượng trong plate quy đổi theo tỉ lệ khối lượng nên làm tròn ở đây sẽ lệch macro (4.9 g → 9.8 g phải gấp đôi)
    grams: shownGrams,
    servings: food.servings.map((item) => ({
      id: item.id,
      name: item.servingName,
      weightInGrams: item.weightInGrams,
    })),
  })

  const ringValue: Record<string, number> = { calories, protein, fat, carbs }
  const rings: ImpactItem[] = RINGS.map((ring) => {
    return { ...ring, percent: goalPercent(goals[ring.key], ringValue[ring.key]) }
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        // Vuốt cuộn nội dung thì đóng thanh nhập (bỏ focus ô lượng → chip + bàn phím thu lại)
        onTouchMove={() => {
          const active = document.activeElement
          if (active instanceof HTMLInputElement) active.blur()
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6"
      >
        <FoodDetailHeader
          name={food.name}
          brand={food.brand}
          onBack={onBack}
          icon={edit ? 'close' : 'back'}
        />
        <FoodMacroRow
          calories={calories}
          protein={protein}
          fat={fat}
          carbs={carbs}
          shares={macroShares(protein, carbs, fat)}
        />
        <DetailActions
          canCopyToCustom
          isCopyPending={isCopyPending}
          onCopyToCustom={() => onCopyToCustom(food)}
          isFavorite={Boolean(favorite)}
          isFavoriteDisabled={!valid || isFavoritePending}
          onToggleFavorite={toggleFavorite}
          onRemove={edit?.onRemove}
        />

        <hr className="border-border my-6" />
        <section aria-labelledby="detail-impact" className="mb-8 space-y-4">
          <h2 id="detail-impact" className="text-xl font-bold">
            Impact on Targets
          </h2>
          <ImpactRings items={rings} isLoading={isTargetsLoading} />
        </section>

        <NutrientSections
          food={food}
          grams={shownGrams}
          goals={goals}
          isLoading={isTargetsLoading}
        />
      </div>

      <QuantityBar
        quantity={quantity}
        onQuantityChange={changeQuantity}
        unit={unit}
        onUnitChange={(next) => switchTo(next)}
        servings={food.servings.map((item) => ({ id: item.id, name: item.servingName }))}
        servingId={servingId}
        onSelectServing={(id) => switchTo('serving', id)}
        servingName={serving?.servingName ?? null}
        grams={shownGrams}
        valid={valid}
        isLogging={edit ? edit.isSaving : isLogging}
        variant={edit ? 'edit' : 'add'}
        showWeightUnits={edit?.weightUnits !== false}
        onLogFoods={() => onLogFoods(buildItem())}
        onAdd={() =>
          edit
            ? edit.onDone({ servingId: favoriteServingId, quantity: logQuantity })
            : onAdd(buildItem())
        }
        mode={entryMode}
        onModeChange={switchMode}
        macroKey={macroKey}
        onMacroKeyChange={switchMacro}
        macroText={macroText}
        onMacroTextChange={enterMacro}
        macroAvailable={macroAvailable}
      />
    </div>
  )
}
