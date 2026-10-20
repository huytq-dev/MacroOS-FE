import { AxiosError } from 'axios'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import type {
  AiDish,
  AiIngredient,
  IngredientState,
  MacroTotals,
  PlateItem,
  ResolvedIngredient,
} from './types/food-log.types'

/** Chỉnh sửa của user trên một nguyên liệu AI: đổi gram, xoá khỏi món, hoặc thay bằng món tự chọn (khi AI không tìm được). */
export interface IngredientEdit {
  readonly grams?: number
  /** Cỡ khẩu phần user chọn ở AmountSheet ("2 medium"); không có thì giữ khẩu phần của kết quả resolve (số lượng co giãn theo gram). */
  readonly serving?: {
    readonly quantity: number
    readonly unitLabel: string
    readonly servingId: string | null
  }
  readonly removed?: boolean
  readonly replacement?: ResolvedIngredient
}

export interface AiPlateEdits {
  readonly ingredients: Readonly<Record<string, IngredientEdit>>
  /** Hệ số "1 plate" của từng món (nhân gram mọi nguyên liệu của món). */
  readonly dishScales: Readonly<Record<string, number>>
}

export const EMPTY_AI_EDITS: AiPlateEdits = { ingredients: {}, dishScales: {} }

/** Nguyên liệu đã có số liệu (khớp / ước lượng / do user chọn) sau khi áp mọi chỉnh sửa. */
export interface LiveIngredient {
  readonly ingredient: AiIngredient
  readonly dishId: string
  readonly data: ResolvedIngredient
  /** Số liệu đã bị user đổi (gram, số món) so với kết quả resolve. */
  readonly replaced: boolean
}

/** Nhân mọi số đo của một kết quả resolve với `factor` (macro tỉ lệ thuận khối lượng). */
export const scaleResolved = (data: ResolvedIngredient, factor: number): ResolvedIngredient => ({
  ...data,
  quantity: data.quantity * factor,
  weightGrams: data.weightGrams * factor,
  calories: data.calories * factor,
  protein: data.protein * factor,
  fat: data.fat * factor,
  carbs: data.carbs * factor,
})

/** Kết quả resolve gốc của nguyên liệu (món user chọn thay thế ưu tiên hơn kết quả AI). */
export const baseDataOf = (
  state: IngredientState | undefined,
  edit: IngredientEdit | undefined
): ResolvedIngredient | null =>
  edit?.replacement ?? (state?.status === 'matched' ? state.data : null)

/** Các nguyên liệu còn sống (chưa xoá, đã có số liệu) kèm số liệu sau khi áp chỉnh sửa và hệ số của món. */
export function liveIngredients(
  dishes: readonly AiDish[],
  states: Readonly<Record<string, IngredientState>>,
  edits: AiPlateEdits
): LiveIngredient[] {
  return dishes.flatMap((dish) =>
    dish.ingredients.flatMap((ingredient) => {
      const edit = edits.ingredients[ingredient.id]
      const base = baseDataOf(states[ingredient.id], edit)
      if (!base || edit?.removed) return []
      const dishScale = edits.dishScales[dish.id] ?? 1
      const grams = edit?.grams ?? base.weightGrams
      const factor = base.weightGrams > 0 ? (grams * dishScale) / base.weightGrams : dishScale
      const scaled = factor === 1 ? base : scaleResolved(base, factor)
      // Cỡ khẩu phần user chọn thay đơn vị hiển thị và khẩu phần ghi nhật ký; macro đã theo gram nên không đổi
      const serving = edit?.serving
      return [
        {
          ingredient,
          dishId: dish.id,
          data: serving
            ? {
                ...scaled,
                quantity: serving.quantity * dishScale,
                unitLabel: serving.unitLabel,
                servingId: serving.servingId,
              }
            : scaled,
          replaced: factor !== 1 || Boolean(edit?.replacement),
        },
      ]
    })
  )
}

export const sumLive = (list: readonly LiveIngredient[]) => ({
  calories: list.reduce((sum, item) => sum + item.data.calories, 0),
  protein: list.reduce((sum, item) => sum + item.data.protein, 0),
  fat: list.reduce((sum, item) => sum + item.data.fat, 0),
  carbs: list.reduce((sum, item) => sum + item.data.carbs, 0),
  weightGrams: list.reduce((sum, item) => sum + item.data.weightGrams, 0),
})

export const totalsOf = (list: readonly LiveIngredient[]): MacroTotals => {
  const sum = sumLive(list)
  return { calories: sum.calories, protein: sum.protein, carbs: sum.carbs, fat: sum.fat, fiber: 0 }
}

/** Dòng plate từ một nguyên liệu: dùng cho Log Foods, thẻ Nutrition (POST plate/nutrients) và tổng ở thanh trên cùng. */
export const toPlateItem = ({ ingredient, data }: LiveIngredient, key: string): PlateItem => ({
  key,
  foodItemId: data.foodItemId,
  name: data.foodName ?? ingredient.name,
  foodServingId: data.servingId ?? null,
  servingLabel: data.unitLabel,
  quantity: Number(data.quantity.toFixed(2)),
  calories: data.calories,
  protein: data.protein,
  carbs: data.carbs,
  fat: data.fat,
  emoji: data.emoji,
  iconKey: data.iconKey ?? null,
  grams: data.weightGrams,
})

/**
 * Lý do lỗi khi phân tích bữa ăn bằng AI, nói rõ thay cho câu chung "Can't reach the server" (mọi lỗi 5xx trước đây đều rơi vào câu đó):
 * 503 = server chưa cấu hình AI, 502/504 hoặc quá thời gian = AI bận, 413 = ảnh quá lớn. Lỗi khác giữ cách hiển thị chung của form.
 */
export function aiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    if (status === 503) return 'AI meal analysis is not available on the server right now.'
    if (status === 413) return 'Photos are too large. Try fewer or smaller photos.'
    if (status === 502 || status === 504 || error.code === AxiosError.ECONNABORTED)
      return 'AI is busy or took too long. Please try again in a moment.'
  }
  return getFormErrorMessage(error)
}

/** Cạnh dài tối đa và chất lượng JPEG khi gửi ảnh cho AI: đủ rõ để nhận món, nhỏ hơn nhiều lần ảnh gốc của điện thoại. */
const AI_PHOTO_MAX_EDGE = 1600
const AI_PHOTO_QUALITY = 0.85

/**
 * Thu nhỏ ảnh trước khi gửi: ảnh gốc iPhone 3–5 MB × 3 vượt giới hạn body của proxy /api (Vercel ~4.5 MB) và làm chậm AI.
 * Ảnh đã nhỏ hơn giới hạn thì giữ nguyên; trình duyệt không giải mã được (định dạng lạ) thì gửi ảnh gốc để BE báo lỗi rõ ràng.
 */
export async function downscalePhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, AI_PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= 1_500_000) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', AI_PHOTO_QUALITY)
    )
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}
