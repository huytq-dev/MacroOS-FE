import type { FoodCategory } from '@/config/enums'
import type { CustomFoodRequest, FoodDetail } from '@/features/foods/types/food.types'
import {
  LIMITS,
  NUTRIENT_ROWS,
  WEIGHT_UNITS,
  type Basis,
  type TableMode,
} from './create-food.config'

/**
 * Trạng thái form Create Food. Mọi ô nhập giữ dạng chuỗi đúng như người dùng thấy: số liệu dinh dưỡng theo cơ sở đang chọn
 * (1 khẩu phần, 100 g hoặc 100 ml) và theo đơn vị đang chọn của từng hàng; chỉ khi gửi mới quy về "trên 100 g" của BE.
 */
export interface CreateFoodState {
  readonly name: string
  readonly brand: string
  readonly barcode: string
  readonly iconKey: string | null
  readonly category: FoodCategory
  readonly basis: Basis
  /** Khối lượng của một khẩu phần, theo `weightUnit`. */
  readonly weight: string
  readonly weightUnit: (typeof WEIGHT_UNITS)[number]['label']
  readonly servingQty: string
  readonly servingName: string
  readonly mode: TableMode
  readonly values: Readonly<Record<string, string>>
  /** Đơn vị đang chọn của các hàng có đơn vị phụ (nhãn); thiếu = đơn vị gốc. */
  readonly units: Readonly<Record<string, string>>
}

const MACRO_KEYS = ['calories', 'protein', 'fat', 'carbs'] as const
const SCALE = 10_000

export const parseNumber = (text: string): number | null => {
  const trimmed = text.trim().replace(',', '.')
  if (trimmed === '') return null
  // Phân số "1/2" (bàn phím số của iOS có phím "/")
  const fraction = trimmed.match(/^(\d+)\/(\d+)$/)
  if (fraction) return Number(fraction[2]) === 0 ? null : Number(fraction[1]) / Number(fraction[2])
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

/** Số hiển thị trong ô: tối đa 4 số lẻ, bỏ số 0 thừa ("115.96", "0.379", "30.796"). */
export const formatValue = (value: number): string => String(Math.round(value * SCALE) / SCALE)

const weightUnitGrams = (unit: CreateFoodState['weightUnit']) =>
  WEIGHT_UNITS.find((item) => item.label === unit)?.grams ?? 1

/** Khối lượng một khẩu phần tính bằng gam; null khi chưa nhập hoặc không hợp lệ. */
export const servingGrams = (state: CreateFoodState): number | null => {
  const value = parseNumber(state.weight)
  return value !== null && value > 0 ? value * weightUnitGrams(state.weightUnit) : null
}

/** Số gam mà các ô dinh dưỡng đang tính trên: khẩu phần (theo khối lượng đã nhập), hoặc 100 g / 100 ml. */
export const basisGrams = (state: CreateFoodState): number | null =>
  state.basis === 'serving' ? servingGrams(state) : 100

/** Hệ số quy về đơn vị gốc của một hàng theo đơn vị đang chọn (hàng không có đơn vị phụ: 1). */
export const unitFactor = (
  key: string,
  units: CreateFoodState['units'],
  label?: string
): number => {
  const alt = NUTRIENT_ROWS[key]?.alt
  if (!alt) return 1
  return alt.find((unit) => unit.label === (label ?? units[key]))?.factor ?? 1
}

/** Nhãn cơ sở cho tiêu đề bảng: "per 1.0 large - 3 1/4" diameter (223 g)", "per 100 g", "per 100 ml". */
export function basisLabel(state: CreateFoodState): string {
  if (state.basis === '100g') return 'per 100 g'
  if (state.basis === '100ml') return 'per 100 ml'
  const qty = parseNumber(state.servingQty)
  const grams = servingGrams(state)
  const shownQty = qty === null ? '1.0' : Number.isInteger(qty) ? qty.toFixed(1) : String(qty)
  const gramsText = grams === null ? '' : ` (${formatValue(grams)} g)`
  return `per ${shownQty} ${state.servingName.trim() || 'serving'}${gramsText}`
}

/** Giá trị gốc (đơn vị gốc, trên 100 g) của một chất trong món nguồn; null = chưa có dữ liệu. */
function sourcePer100g(food: FoodDetail, key: string): number | null {
  const macros: Record<string, number> = {
    calories: food.nutrition.caloriesPer100g,
    protein: food.nutrition.proteinPer100g,
    carbs: food.nutrition.carbsPer100g,
    fat: food.nutrition.fatPer100g,
  }
  return macros[key] ?? food.nutrientsPer100g?.[key] ?? null
}

export const EMPTY_STATE: CreateFoodState = {
  name: '',
  brand: '',
  barcode: '',
  iconKey: null,
  category: 'Other',
  basis: 'serving',
  weight: '',
  weightUnit: 'g',
  servingQty: '1',
  servingName: '',
  mode: 'non-us',
  values: {},
  units: {},
}

/**
 * Trạng thái ban đầu. Có món nguồn ("To Custom") thì điền sẵn tên, hãng, icon, khẩu phần mặc định và mọi chất của món, quy về
 * một khẩu phần; món không có khẩu phần riêng (chỉ "100 g") thì nhập theo 100 g.
 */
export function initialState(source?: FoodDetail): CreateFoodState {
  if (!source) return EMPTY_STATE
  const serving = source.servings.find((item) => item.isDefault) ?? source.servings[0]
  const onServing = Boolean(serving) && !/^\s*100\s*g\s*$/i.test(serving.servingName)
  const grams = onServing ? serving.weightInGrams : 100
  const values: Record<string, string> = {}
  for (const key of Object.keys(NUTRIENT_ROWS)) {
    const per100g = sourcePer100g(source, key)
    if (per100g !== null) values[key] = formatValue((per100g * grams) / 100)
  }
  // Tên khẩu phần của BE có thể đã kèm số lượng ("1 lát", "2 slices"): tách ra ô số lượng và ô tên như MacroFactor
  const named = onServing ? serving.servingName.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s+(.+)$/) : null
  return {
    ...EMPTY_STATE,
    name: source.name,
    brand: source.brand ?? '',
    iconKey: source.iconKey ?? null,
    category: source.category,
    basis: onServing ? 'serving' : '100g',
    weight: onServing ? formatValue(serving.weightInGrams) : '',
    servingQty: named ? named[1] : '1',
    servingName: onServing ? (named ? named[2] : serving.servingName) : '',
    values,
  }
}

/** Macro của một khẩu phần chưa rõ khối lượng ("To Custom" từ dòng Quick Add / ước lượng AI): điền sẵn tên và bốn macro. */
export interface MacroSeed {
  readonly name: string
  readonly calories: number
  readonly protein: number
  readonly carbs: number
  readonly fat: number
}

export function seedState(seed: MacroSeed): CreateFoodState {
  return {
    ...EMPTY_STATE,
    name: seed.name,
    servingName: 'serving',
    values: {
      calories: formatValue(seed.calories),
      protein: formatValue(seed.protein),
      carbs: formatValue(seed.carbs),
      fat: formatValue(seed.fat),
    },
  }
}

/** Đổi cơ sở (khẩu phần ↔ 100 g ↔ 100 ml) mà vẫn giữ nguyên hàm lượng thật: nhân mọi số đã gõ theo tỷ lệ gam mới / gam cũ. */
export function switchBasis(state: CreateFoodState, next: Basis): CreateFoodState {
  if (next === state.basis) return state
  // Khối lượng khẩu phần chưa nhập thì lấy 100 g làm mốc để các số không bị mất
  const weight = state.weight.trim() === '' ? '100' : state.weight
  const draft = { ...state, weight }
  const from = basisGrams(draft) ?? 100
  const to = next === 'serving' ? (servingGrams({ ...draft, basis: next }) ?? 100) : 100
  const values: Record<string, string> = {}
  for (const [key, text] of Object.entries(state.values)) {
    const number = parseNumber(text)
    values[key] = number === null ? text : formatValue((number * to) / from)
  }
  return { ...state, basis: next, weight, values }
}

export type FieldErrors = Readonly<Record<string, string>>

/** Quy các ô về "trên 100 g" của BE và kiểm tra theo luật của BE; lỗi thì trả bảng lỗi theo ô (`name`, `serving`, khoá chất…). */
export function buildRequest(
  state: CreateFoodState
):
  | { request: CustomFoodRequest; errors?: undefined }
  | { request?: undefined; errors: FieldErrors } {
  const errors: Record<string, string> = {}
  const name = state.name.trim()
  if (!name) errors.name = 'Enter a name'

  const grams = basisGrams(state)
  if (grams === null) errors.serving = 'Enter the serving weight'
  const qty = parseNumber(state.servingQty)
  if (state.basis === 'serving') {
    if (!state.servingName.trim()) errors.serving = 'Enter a serving name'
    else if (qty === null || qty <= 0) errors.serving = 'Enter the serving quantity'
  }

  const per100g: Record<string, number> = {}
  for (const key of Object.keys(NUTRIENT_ROWS)) {
    const text = state.values[key] ?? ''
    const number = parseNumber(text)
    if (text.trim() !== '' && (number === null || number < 0)) errors[key] = "Can't be negative"
    else if (number !== null && grams !== null)
      per100g[key] = (number * unitFactor(key, state.units) * 100) / grams
  }
  for (const key of MACRO_KEYS) if (!(key in per100g) && !errors[key]) errors[key] = 'Required'

  if (Object.keys(errors).length === 0) {
    if (per100g.calories > LIMITS.caloriesPer100g)
      errors.calories = `Max ${LIMITS.caloriesPer100g} kcal per 100 g`
    for (const key of ['protein', 'fat', 'carbs'] as const)
      if (per100g[key] > LIMITS.macroPer100g) errors[key] = `Max ${LIMITS.macroPer100g} g per 100 g`
    if (!errors.fat && per100g.protein + per100g.carbs + per100g.fat > LIMITS.macroSumPer100g)
      errors.fat = "Protein + carbs + fat per 100 g can't exceed 100 g"
  }
  if (Object.keys(errors).length > 0 || grams === null) return { errors }

  const round = (value: number) => Math.round(value * SCALE) / SCALE
  const barcode = state.barcode.trim()
  const servingName = state.servingName.trim()
  return {
    request: {
      name,
      brand: state.brand.trim() || null,
      category: state.category,
      barcode: barcode || null,
      iconKey: state.iconKey,
      nutrition: {
        caloriesPer100g: round(per100g.calories),
        proteinPer100g: round(per100g.protein),
        carbsPer100g: round(per100g.carbs),
        fatPer100g: round(per100g.fat),
      },
      nutrients: Object.entries(per100g).flatMap(([key, amount]) => {
        const code = NUTRIENT_ROWS[key]?.code
        return code ? [{ code, amountPer100g: round(amount) }] : []
      }),
      // Cơ sở 100 g / 100 ml: BE tự thêm khẩu phần "100 g"; cơ sở khẩu phần: tên kèm số lượng như dữ liệu sẵn có ("1 lát", "2 slices")
      servings:
        state.basis === 'serving'
          ? [
              {
                servingName: `${formatValue(qty ?? 1)} ${servingName}`,
                weightInGrams: Math.round(grams * 100) / 100,
                isDefault: true,
              },
            ]
          : null,
    },
  }
}

/** Số gam để ghi nhật ký ngay sau khi tạo ("Create & Add"): một khẩu phần, hoặc 100 g. */
export const gramsToLog = (state: CreateFoodState): number => basisGrams(state) ?? 100
