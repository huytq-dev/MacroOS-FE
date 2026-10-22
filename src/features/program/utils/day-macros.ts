import { DAY_OF_WEEK, type DayOfWeek } from '@/config/enums'
import { KCAL_PER_GRAM } from '@/features/nutrition/atwater'
import type { DayTarget } from '../types/program.types'

/** Thứ tự bảy ngày của chương trình: Monday → Sunday (nhãn một chữ cái của từng ngày: `dayLetter` ở `lib/week`). */
// Object.keys trả string[]; khoá của DAY_OF_WEEK chính là DayOfWeek nên ép kiểu an toàn
export const WEEK_DAYS = Object.keys(DAY_OF_WEEK) as DayOfWeek[]

export interface MacroGrams {
  readonly proteinG: number
  readonly carbsG: number
  readonly fatG: number
}

/** Thông số user kéo ở editor theo ngày: calo, protein (g/kg cân nặng) và phần carb trong số calo còn lại sau protein (0–1). */
export interface DayParams {
  readonly kcal: number
  readonly proteinPerKg: number
  readonly carbPct: number
}

export interface EditableDay extends DayParams {
  readonly dayOfWeek: DayOfWeek
  readonly locked: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Thông số → gram macro, tính tại chỗ để biểu đồ đổi mượt khi kéo (BE kiểm tra lại khi lưu):
 * P = g/kg × cân nặng; calo còn lại = kcal − 4P; C = %carb × còn lại / 4; F = (1 − %carb) × còn lại / 9.
 */
export const macrosOf = (
  { kcal, proteinPerKg, carbPct }: DayParams,
  weightKg: number
): MacroGrams => {
  const proteinG = proteinPerKg * weightKg
  const remaining = Math.max(kcal - KCAL_PER_GRAM.protein * proteinG, 0)
  return {
    proteinG,
    carbsG: (carbPct * remaining) / KCAL_PER_GRAM.carbs,
    fatG: ((1 - carbPct) * remaining) / KCAL_PER_GRAM.fat,
  }
}

/** Ngược lại: ngày có sẵn gram (từ preview của BE) → thông số để kéo. */
export const paramsOf = (
  day: Pick<DayTarget, 'calories' | 'proteinG' | 'carbsG'>,
  weightKg: number
): DayParams => {
  const remaining = day.calories - KCAL_PER_GRAM.protein * day.proteinG
  return {
    kcal: day.calories,
    proteinPerKg: weightKg > 0 ? day.proteinG / weightKg : 0,
    carbPct: remaining > 0 ? clamp((day.carbsG * KCAL_PER_GRAM.carbs) / remaining, 0, 1) : 0.5,
  }
}

/** Trần protein (g/kg) của một ngày: không vượt trần BE và không quá số calo của ngày đó. */
export const maxProteinPerKg = (kcal: number, weightKg: number, cap: number) =>
  Math.max(0, Math.min(cap, kcal / (KCAL_PER_GRAM.protein * weightKg)))

/** Calo do macro tạo ra: 4P + 4C + 9F. */
export const macroKcalOf = ({ proteinG, carbsG, fatG }: MacroGrams) =>
  KCAL_PER_GRAM.protein * proteinG + KCAL_PER_GRAM.carbs * carbsG + KCAL_PER_GRAM.fat * fatG

/**
 * Ngày đang sửa → mục tiêu gửi BE (gram làm tròn nguyên). Protein không bao giờ vượt trần BE (`proteinPerKgMax` × cân nặng): ở đúng trần
 * 4.0 × 72.38 = 289.52 g, làm tròn lên 290 sẽ bị BE từ chối (DayProteinMax) nên hạ xuống số nguyên không vượt trần (289).
 */
export const toDayTarget = (
  day: EditableDay,
  weightKg: number,
  proteinPerKgMax?: number
): DayTarget => {
  const { proteinG, carbsG, fatG } = macrosOf(day, weightKg)
  const proteinCap =
    proteinPerKgMax !== undefined && proteinPerKgMax > 0
      ? Math.floor(proteinPerKgMax * weightKg + 1e-9)
      : Infinity
  return {
    dayOfWeek: day.dayOfWeek,
    calories: Math.round(day.kcal),
    proteinG: Math.min(Math.round(proteinG), proteinCap),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
    isLocked: day.locked,
  }
}

/** Bảy ngày từ BE (đủ 7 phần tử theo thứ tự, hoặc có `dayOfWeek`) → danh sách đủ Monday → Sunday. */
export const orderedDays = (days: readonly DayTarget[]): DayTarget[] =>
  WEEK_DAYS.map(
    (dayOfWeek, index) => days.find((day) => day.dayOfWeek === dayOfWeek) ?? days[index] ?? days[0]
  )
