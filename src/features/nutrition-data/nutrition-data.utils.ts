import type { NutritionDay, SaveNutritionDayRequest } from './types/nutrition-data.types'

export type FieldKey = 'calories' | 'protein' | 'fat' | 'carbs'

/** Energy là số nguyên ≤ 99999; macro tối đa 4 chữ số nguyên và 1 số lẻ ("," được đổi thành "."). */
export const FIELD_PATTERN: Record<FieldKey, RegExp> = {
  calories: /^\d{0,5}$/,
  protein: /^\d{0,4}(\.\d?)?$/,
  fat: /^\d{0,4}(\.\d?)?$/,
  carbs: /^\d{0,4}(\.\d?)?$/,
}

/** Giới hạn của BE (`PUT /nutrition-data`): calories 0–10000, macro 0–1000 g. */
export const MAX_CALORIES = 10000
export const MAX_MACRO_G = 1000

export type FieldTexts = Readonly<Record<FieldKey, string>>

export const toText = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)

/** Ô trống (hoặc chỉ có ".") = CHƯA nhập (null), không bao giờ là 0. */
export const toNumber = (text: string) => (text === '' || text === '.' ? null : Number(text))

/**
 * Nội dung ban đầu của các ô = số user ĐÃ NHẬP (`manual*`, null = chưa nhập → ô trống, 0 → "0"). Không điền số hiệu lực hay tổng Food Log: một lần sửa một ô sẽ
 * thành override gồm cả các ô còn lại, nên macro của Food Log không được lọt vào thành số nhập tay.
 */
export const initialTexts = (existing: NutritionDay | undefined): FieldTexts => ({
  calories: toText(existing?.manualCaloriesKcal),
  protein: toText(existing?.manualProteinG),
  fat: toText(existing?.manualFatG),
  carbs: toText(existing?.manualCarbsG),
})

export type SaveOutcome =
  | { readonly ok: true; readonly payload: SaveNutritionDayRequest }
  | { readonly ok: false; readonly error: string }

const NONE = { calories: null, proteinG: null, fatG: null, carbsG: null } as const

/**
 * Yêu cầu `PUT /nutrition-data` từ những gì user đang thấy trong bảng (Contract v2: macro-only và calories-only đều hợp lệ, null ≠ 0, cho phép trên ngày có món).
 * Quy tắc quan trọng nhất: chỉ gửi SỐ khi user thật sự đổi số — mở "Edit Day" rồi Save mà không đổi gì thì chỉ gửi cờ, nên không tạo override ngoài ý muốn.
 * Xoá trống mọi ô của ngày đang có override KHÔNG xoá gì và không báo thành công: xoá override là hành động riêng ("Remove manual entry").
 */
export function buildSavePayload(input: {
  readonly date: string
  readonly texts: FieldTexts
  readonly fasting: boolean
  readonly incomplete: boolean
  readonly existing: NutritionDay | undefined
}): SaveOutcome {
  const { date, texts, fasting, incomplete, existing } = input
  const values = {
    calories: toNumber(texts.calories),
    proteinG: toNumber(texts.protein),
    fatG: toNumber(texts.fat),
    carbsG: toNumber(texts.carbs),
  }
  const flags = { isFasting: fasting, isIncomplete: incomplete }
  const typed = Object.values(values).filter((value) => value !== null)

  if (fasting) {
    if (typed.some((value) => value !== 0))
      return {
        ok: false,
        error:
          "A fasting day can't also have manual nutrition above zero. Turn fasting off or set the values to zero.",
      }
    // Ngày đang có số nhập tay thì nhịn ăn chỉ hợp lệ khi các số về 0: gửi đúng các số 0 user đã gõ để thay số nhập tay (gửi chỉ cờ thì BE vẫn thấy số cũ và báo lỗi lần nữa, user kẹt vòng lặp)
    const lowered = existing?.hasOverride === true && typed.length > 0
    return { ok: true, payload: { date, ...(lowered ? values : NONE), ...flags } }
  }
  if (values.calories !== null && values.calories > MAX_CALORIES)
    return { ok: false, error: `Calories are at most ${MAX_CALORIES}` }
  if ([values.proteinG, values.fatG, values.carbsG].some((value) => (value ?? 0) > MAX_MACRO_G))
    return { ok: false, error: `Macros are at most ${MAX_MACRO_G} g` }
  if (typed.length === 0) {
    if (existing?.hasOverride)
      return {
        ok: false,
        error:
          "Clearing every field doesn't remove the manual values. Use Remove manual entry to do that.",
      }
    // Không nhập số: chỉ đổi cờ của ngày đã có dữ liệu (ngày trống thì không có gì để lưu)
    if (!existing) return { ok: false, error: 'Enter calories or macros, or turn on fasting' }
    return { ok: true, payload: { date, ...NONE, ...flags } }
  }
  // Số không đổi so với số đã nhập thì chỉ gửi cờ
  const unchanged =
    existing?.hasOverride === true &&
    values.calories === existing.manualCaloriesKcal &&
    values.proteinG === existing.manualProteinG &&
    values.fatG === existing.manualFatG &&
    values.carbsG === existing.manualCarbsG
  return { ok: true, payload: { date, ...(unchanged ? NONE : values), ...flags } }
}

/**
 * Yêu cầu không đổi gì so với ngày đang có (không số nào, cờ giống hệt): không gửi và không báo "saved" — báo thành công cho thứ chưa hề thay đổi là thành
 * công giả. Ngày chưa có dữ liệu thì không bao giờ là "không đổi" (đã bị chặn ở `buildSavePayload`).
 */
export const isNoChange = (
  payload: SaveNutritionDayRequest,
  existing: NutritionDay | undefined
): boolean =>
  existing !== undefined &&
  payload.calories === null &&
  payload.proteinG === null &&
  payload.fatG === null &&
  payload.carbsG === null &&
  (payload.isFasting ?? existing.isFasting) === existing.isFasting &&
  (payload.isIncomplete ?? existing.isIncomplete) === existing.isIncomplete

// ── Lỗi của BE (P0 + v2): chỉ khoá theo `errors.reasonCode`, KHÔNG báo thành công ─────────────────────────────────────────────────────────────────────

/**
 * 409 `MANUAL_OVERRIDE_UNAVAILABLE` (P0, nay không còn gặp), `FASTING_NEEDS_EMPTY_DAY` (bật nhịn ăn trên ngày đã có món), `CONCURRENT` (hai yêu cầu ghi chồng lên cùng một
 * ngày, bên thua); 400 `USE_REMOVE_OVERRIDE` / `NOTHING_TO_SAVE` (xoá trống mọi ô) và `FASTING_WITH_MANUAL_NUTRITION` (nhịn ăn mà có số nhập tay > 0). Mọi trường hợp: BE KHÔNG đổi gì.
 */
export type NdmReason =
  | 'MANUAL_OVERRIDE_UNAVAILABLE'
  | 'FASTING_NEEDS_EMPTY_DAY'
  | 'CONCURRENT'
  | 'USE_REMOVE_OVERRIDE'
  | 'NOTHING_TO_SAVE'
  | 'FASTING_WITH_MANUAL_NUTRITION'

const REASON_MESSAGE: Readonly<Record<NdmReason, string>> = {
  MANUAL_OVERRIDE_UNAVAILABLE:
    "Manual nutrition can't be saved for a day that has logged foods or several entries yet. Nothing was changed; your Food Log is intact.",
  FASTING_NEEDS_EMPTY_DAY:
    'This day has logged entries. Remove them (or the manual entry) before marking it as a fasting day. Nothing was changed.',
  CONCURRENT:
    'This day was just updated somewhere else, so nothing was changed. Close this and try again.',
  USE_REMOVE_OVERRIDE:
    "Clearing every field doesn't remove the manual values. Use Remove manual entry to do that. Nothing was changed.",
  NOTHING_TO_SAVE: 'There is nothing to save. To clear manual values use Remove manual entry.',
  FASTING_WITH_MANUAL_NUTRITION:
    "This day is marked as fasting, so it can't also have manual nutrition above zero. Remove the fasting mark or lower the values. Nothing was changed.",
}

const BY_CODE: Readonly<Record<string, NdmReason>> = Object.fromEntries(
  Object.keys(REASON_MESSAGE).map((code) => [code, code as NdmReason])
)

interface ErrorLike {
  readonly response?: {
    readonly status?: number
    readonly data?: {
      readonly errors?: Record<string, readonly string[] | undefined> | null
    } | null
  }
}

/**
 * Mã lý do của một lỗi 400 / 409 từ các endpoint NDM / Food Log; một 409 không mang mã (hoặc mã lạ) là bên thua của lần ghi chồng; null = lỗi khác (giữ cách
 * báo lỗi thường, câu của BE).
 */
export function ndmReasonOf(error: unknown): NdmReason | null {
  const response = (error as ErrorLike | null | undefined)?.response
  const status = response?.status
  if (status !== 400 && status !== 409) return null
  const errors = response?.data?.errors ?? {}
  const key = Object.keys(errors).find((name) => name.toLowerCase() === 'reasoncode')
  const code = key ? errors[key]?.[0] : undefined
  const known = code ? BY_CODE[code] : undefined
  if (known) return known
  return status === 409 ? 'CONCURRENT' : null
}

/** Câu hiện cho user theo mã lý do; lỗi khác thì `fallback(error)` (câu của BE / lỗi mạng). */
export const ndmErrorMessage = (error: unknown, fallback: (error: unknown) => string): string => {
  const reason = ndmReasonOf(error)
  return reason ? REASON_MESSAGE[reason] : fallback(error)
}

// ── Bốn ý định, bốn endpoint ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type SaveOp =
  | { readonly kind: 'save'; readonly payload: SaveNutritionDayRequest }
  | { readonly kind: 'fasting'; readonly date: string; readonly isFasting: boolean }
  | { readonly kind: 'incomplete'; readonly date: string; readonly isIncomplete: boolean }

/**
 * Các thao tác BE cần cho một lần Save. Có SỐ → MỘT `PUT /nutrition-data` (số + cờ nguyên tử). Chỉ đổi CỜ → đúng endpoint của từng cờ (`PUT /{date}/fasting`,
 * `PUT /{date}/incomplete`): mỗi endpoint chỉ đổi một cờ, không đụng gì khác. Nhịn ăn đi trước để một ngày mới vừa nhịn ăn vừa chưa đủ vẫn hợp lệ.
 */
export function planSave(
  payload: SaveNutritionDayRequest,
  existing: NutritionDay | undefined
): readonly SaveOp[] {
  const hasNumbers = [payload.calories, payload.proteinG, payload.fatG, payload.carbsG].some(
    (value) => value !== null
  )
  if (hasNumbers) return [{ kind: 'save', payload }]
  const ops: SaveOp[] = []
  if (payload.isFasting !== null && payload.isFasting !== (existing?.isFasting ?? false))
    ops.push({ kind: 'fasting', date: payload.date, isFasting: payload.isFasting })
  if (payload.isIncomplete !== null && payload.isIncomplete !== (existing?.isIncomplete ?? false))
    ops.push({ kind: 'incomplete', date: payload.date, isIncomplete: payload.isIncomplete })
  return ops
}

// ── Hiển thị theo BE (không suy ra nguồn / điều kiện thuật toán từ số) ──────────────────────────────────────────────────────────────────────────────

export const SOURCE_LABEL: Readonly<Record<NutritionDay['source'], string>> = {
  Manual: 'Manual',
  FoodLog: 'Food Log',
  Fasting: 'Fasting',
}

/** Chữ đọc được của nguồn (icon giống nhau, `title` không có trên màn cảm ứng). */
export const sourceSrText = (day: Pick<NutritionDay, 'source'>) =>
  day.source === 'Manual'
    ? ', entered manually'
    : day.source === 'Fasting'
      ? ', fasting day'
      : ', logged in Food Log'

/** Ngày KHÔNG được thuật toán dùng theo BE (`isValidForAlgorithms`), trừ ngày đánh dấu chưa đủ (đã có biểu tượng riêng). */
export const notUsedForExpenditure = (
  day: Pick<NutritionDay, 'isValidForAlgorithms' | 'isIncomplete'>
) => !day.isValidForAlgorithms && !day.isIncomplete

/** Một dòng thông tin nhỏ, không chặn, cho ngày có xung đột BE chỉ báo (không tự đổi gì). null = không có xung đột. */
export function conflictNotice(day: Pick<NutritionDay, 'conflict'>): string | null {
  if (day.conflict === 'MANUAL_ZERO_WITH_FOOD_LOG')
    return 'Manual data takes priority. Foods logged in the Food Log are kept.'
  if (day.conflict === 'FASTING_WITH_MANUAL_NUTRITION')
    return 'This day is marked as fasting and also has manual values above zero. Remove the fasting mark or lower the values.'
  return null
}

/** Dòng giải thích điều kiện thuật toán của BE cho một ngày KHÔNG được dùng; null khi ngày được dùng. */
export function eligibilityNotice(
  day: Pick<NutritionDay, 'isValidForAlgorithms' | 'isIncomplete'>
): string | null {
  if (day.isValidForAlgorithms) return null
  return day.isIncomplete
    ? 'This day is marked incomplete, so Expenditure skips it.'
    : "This day isn't used for Expenditure."
}

const KEPT_BY_NUTRITION_DELETE = 'Foods logged in the Food Log, water and notes are kept.'

/** Delete Nutrition Data (`DELETE /nutrition-data?date=`): xoá tổng nhập tay + cờ nhịn ăn; giữ món, nước, ghi chú. */
export const DELETE_NUTRITION_TITLE = "Delete this day's nutrition data?"
export function deleteNutritionDescription(
  day: Pick<NutritionDay, 'isFasting' | 'hasOverride'> | undefined,
  dateLabel: string
): string {
  const what =
    day?.isFasting && day.hasOverride
      ? `the manual calories and macros you entered for ${dateLabel} and the fasting mark`
      : day?.isFasting
        ? `the fasting mark from ${dateLabel}`
        : `the manual calories and macros you entered for ${dateLabel}`
  return `Deletes ${what}. ${KEPT_BY_NUTRITION_DELETE}`
}

/** Remove Manual Override (`DELETE /nutrition-data/{date}/override`): chỉ tổng nhập tay; ngày quay về các món đã log (nếu có). */
export const REMOVE_OVERRIDE_TITLE = 'Remove the manual entry?'
export const removeOverrideDescription = (dateLabel: string, hasFoods: boolean) =>
  hasFoods
    ? `Removes only the manual calories and macros for ${dateLabel}. Foods, water, notes and the fasting mark are kept, and the day goes back to the foods logged in the Food Log.`
    : `Removes only the manual calories and macros for ${dateLabel}. Water, notes and the fasting mark are kept. No foods are logged on this day, so it will have no nutrition data.`

/** Clear Food Log Day (`DELETE /food-logs/{date}`): xoá mềm các MÓN; giữ tổng nhập tay, nước, ghi chú, cờ nhịn ăn. */
export const CLEAR_FOOD_LOG_TITLE = "Delete this day's foods?"
export const clearFoodLogDescription = (dateLabel: string) =>
  `Deletes all foods logged on ${dateLabel}. Manual calories and macros, water, notes and the fasting mark are kept.`

/**
 * Gộp các trang đã tải (mỗi trang mới nhất trước, trang sau cũ hơn) thành một danh sách mới nhất trước, mỗi ngày MỘT dòng: một ngày xuất hiện ở hai trang (làm mới
 * trong lúc phân trang) giữ bản của trang đến trước, và thứ tự luôn giảm dần theo ngày dù các trang đến lệch nhau.
 */
export function mergePages(pages: readonly (readonly NutritionDay[])[]): NutritionDay[] {
  const seen = new Set<string>()
  const merged: NutritionDay[] = []
  for (const page of pages)
    for (const day of page) {
      if (seen.has(day.date)) continue
      seen.add(day.date)
      merged.push(day)
    }
  return merged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/**
 * Dòng thông tin nhỏ, không chặn, cho ngày có override: xung đột BE chỉ báo thì câu của xung đột; ngày có override VÀ có món thì nhắc "nhập tay được ưu tiên, món vẫn
 * giữ". Không có override / không có món thì null. FE chỉ đọc cờ của BE (`conflict`, `hasOverride`, `entryCount`), không tự suy ra.
 */
export function overrideNotice(
  day: Pick<NutritionDay, 'conflict' | 'hasOverride' | 'entryCount'>
): string | null {
  return (
    conflictNotice(day) ??
    (day.hasOverride && day.entryCount > 0
      ? 'Manual data takes priority. Foods logged in the Food Log are kept.'
      : null)
  )
}
