import { DAY_OF_WEEK, type DayOfWeek } from '@/config/enums'
import { getApiError } from '@/lib/api'
import type { EnergyUnit, Measure } from '@/lib/units'
import type {
  Feasibility,
  FeasibilityDay,
  FeasibilityViolation,
  FeasibilityWarning,
} from '../types/feasibility.types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const isDay = (value: unknown): value is DayOfWeek =>
  typeof value === 'string' && Object.hasOwn(DAY_OF_WEEK, value)
const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const numberOr = (value: unknown, fallback: number) => (isNumber(value) ? value : fallback)
const numberOrNull = (value: unknown) => (isNumber(value) ? value : null)
const stringOrNull = (value: unknown) => (typeof value === 'string' ? value : null)
const strings = (value: unknown): string[] =>
  listOf(value).filter((item): item is string => typeof item === 'string')

const violationOf = (raw: unknown): FeasibilityViolation | null =>
  isRecord(raw) && typeof raw.code === 'string' && typeof raw.detail === 'string'
    ? {
        code: raw.code,
        detail: raw.detail,
        day: isDay(raw.day) ? raw.day : null,
        calories: numberOr(raw.calories, 0),
        proteinG: numberOr(raw.proteinG, 0),
        carbsG: numberOr(raw.carbsG, 0),
        fatG: numberOr(raw.fatG, 0),
        macroKcal: numberOr(raw.macroKcal, 0),
        minFeasibleCalories: numberOrNull(raw.minFeasibleCalories),
        floorKcal: numberOrNull(raw.floorKcal),
      }
    : null

const warningOf = (raw: unknown): FeasibilityWarning | null =>
  isRecord(raw) && typeof raw.code === 'string' && isNumber(raw.differenceKcal)
    ? {
        code: raw.code,
        day: isDay(raw.day) ? raw.day : null,
        calories: numberOr(raw.calories, 0),
        macroKcal: numberOr(raw.macroKcal, 0),
        differenceKcal: raw.differenceKcal,
        toleranceKcal: numberOr(raw.toleranceKcal, 0),
        proteinG: numberOr(raw.proteinG, 0),
        carbsG: numberOr(raw.carbsG, 0),
        fatG: numberOr(raw.fatG, 0),
        message: typeof raw.message === 'string' ? raw.message : '',
      }
    : null

const dayOf = (raw: unknown): FeasibilityDay | null =>
  isRecord(raw) && isDay(raw.dayOfWeek) && isNumber(raw.calories)
    ? {
        dayOfWeek: raw.dayOfWeek,
        calories: raw.calories,
        proteinG: numberOr(raw.proteinG, 0),
        carbsG: numberOr(raw.carbsG, 0),
        fatG: numberOr(raw.fatG, 0),
        isLocked: raw.isLocked === true,
      }
    : null

const present = <T>(item: T | null): item is T => item !== null

/**
 * `FeasibilityResponse` của BE (trường `feasibility` của preview hoặc `data` của 400) → object đã kiểm kiểu; null khi không phải dạng đó
 * (kể cả model Calorie Shift cũ). Trường lạ hoặc thiếu số thì bỏ, không đoán giá trị.
 */
export const parseFeasibility = (data: unknown): Feasibility | null => {
  if (!isRecord(data) || typeof data.isFeasible !== 'boolean') return null
  return {
    isFeasible: data.isFeasible,
    reasonCode: stringOrNull(data.reasonCode),
    reasonCodes: strings(data.reasonCodes),
    violations: listOf(data.violations).map(violationOf).filter(present),
    affectedDays: listOf(data.affectedDays).filter(isDay),
    currentShiftPercent: numberOrNull(data.currentShiftPercent),
    suggestedShiftPercent: numberOrNull(data.suggestedShiftPercent),
    suggestedAction: stringOrNull(data.suggestedAction),
    actions: strings(data.actions),
    currentDailyTargets: listOf(data.currentDailyTargets).map(dayOf).filter(present),
    proposedDailyTargets: listOf(data.proposedDailyTargets).map(dayOf).filter(present),
    warnings: listOf(data.warnings).map(warningOf).filter(present),
    message: stringOrNull(data.message),
  }
}

/** Lỗi 400 của Create / UpdateGoal / EditGoal / SetManual / Check-in Accept → `FeasibilityResponse` trong `data` (không ghi gì); null với mọi lỗi khác. */
export const feasibilityOfError = (error: unknown): Feasibility | null => {
  const apiError = getApiError(error)
  if (apiError?.statusCode !== 400) return null
  const feasibility = parseFeasibility(apiError.data)
  return feasibility && !feasibility.isFeasible ? feasibility : null
}

/** Preview không khả thi (HTTP 200 kèm `feasibility`); khả thi hoặc thiếu thì null. Cảnh báo không chặn vẫn đọc từ `feasibility.warnings`. */
export const infeasibleOf = (feasibility: Feasibility | null | undefined): Feasibility | null =>
  feasibility && !feasibility.isFeasible ? feasibility : null

/** Vấn đề do Calorie Shift (có thể sửa bằng REDUCE_SHIFT / USE_EVEN_DISTRIBUTION) hay vấn đề của chính target tuần. */
export const isShiftInfeasible = (feasibility: Feasibility): boolean =>
  feasibility.reasonCodes.includes('CALORIE_SHIFT_INFEASIBLE')

// kcal / kJ theo cài đặt của user (BE luôn kcal), làm tròn nguyên
const energyText = (kcal: number, energy: Measure<EnergyUnit>) =>
  `${Math.round(energy.convert(kcal)).toLocaleString('en-US')} ${energy.unit}`
const gramsText = (value: number) => `${Math.round(value * 10) / 10} g`
const placeOf = (day: DayOfWeek | null) => (day === null ? 'The week' : DAY_OF_WEEK[day])

/** Một câu cho một vi phạm, đúng số BE trả (không tự tính lại). */
export function violationText(
  violation: FeasibilityViolation,
  energy: Measure<EnergyUnit>
): string {
  const place = placeOf(violation.day)
  switch (violation.detail) {
    case 'NON_POSITIVE_CALORIES':
      return `${place} would be ${energyText(violation.calories, energy)}; a day needs more than 0 ${energy.unit}.`
    case 'BELOW_FLOOR':
      return violation.floorKcal === null
        ? `${place} would be ${energyText(violation.calories, energy)}, below your calorie floor.`
        : `${place} would be ${energyText(violation.calories, energy)}, below your ${energyText(violation.floorKcal, energy)} calorie floor.`
    case 'MACRO_EXCEEDS_CALORIES':
      return violation.minFeasibleCalories === null
        ? `${place}: protein, carbs and fat add up to ${energyText(violation.macroKcal, energy)}, more than the day's ${energyText(violation.calories, energy)}.`
        : `${place}: protein, carbs and fat add up to ${energyText(violation.macroKcal, energy)}, more than the day's ${energyText(violation.calories, energy)}. It needs at least ${energyText(violation.minFeasibleCalories, energy)}.`
    case 'NEGATIVE_MACRO':
      return `${place}: carbs would be ${gramsText(violation.carbsG)}, and a macro can't go below 0.`
    case 'WEEKLY_BUDGET_NOT_CONSERVED':
      // BE: calories = tổng 7 ngày đã lập, macroKcal = ngân sách tuần
      return `The days add up to ${energyText(violation.calories, energy)} but the weekly budget is ${energyText(violation.macroKcal, energy)}.`
    default:
      return `${place} is out of range.`
  }
}

const ACTION_TEXT: Readonly<Record<string, string>> = {
  ADJUST_GOAL_RATE: 'Choose a slower goal rate',
  ADJUST_CALORIES: 'Raise the calories of the affected days',
  ADJUST_MACRO_PREFERENCES: 'Lower the protein or fat of the affected days',
  REDUCE_SHIFT: 'Use a smaller calorie shift',
  USE_EVEN_DISTRIBUTION: 'Use an even split across the week',
  UNLOCK_DAYS: 'Unlock days so the week can be rebalanced',
}

/** Các cách chỉnh BE đề xuất (`actions`) dạng chữ; mã lạ thì bỏ. */
export const actionTexts = (feasibility: Feasibility): string[] =>
  feasibility.actions.flatMap((code) => (code in ACTION_TEXT ? [ACTION_TEXT[code]] : []))

export interface ProposalRow {
  readonly day: DayOfWeek
  /** kcal "trước" (cấu hình hiện tại) và "sau" (đề xuất) của BE, null nếu BE không gửi ngày đó. */
  readonly before: number | null
  readonly after: number | null
}

/** Bảng trước / sau 7 ngày của đề xuất, theo thứ tự BE gửi; rỗng khi BE không có đề xuất. */
export function proposalRows(feasibility: Feasibility): ProposalRow[] {
  if (feasibility.proposedDailyTargets.length === 0) return []
  const before = new Map(feasibility.currentDailyTargets.map((day) => [day.dayOfWeek, day]))
  return feasibility.proposedDailyTargets.map((day) => ({
    day: day.dayOfWeek,
    before: before.get(day.dayOfWeek)?.calories ?? null,
    after: day.calories,
  }))
}

/** Câu giải thích một cảnh báo không chặn (macro ≠ kcal), từ chính các số BE trả. */
export function warningText(warning: FeasibilityWarning, energy: Measure<EnergyUnit>): string {
  const place = placeOf(warning.day)
  const sign = warning.differenceKcal > 0 ? '+' : '−'
  return `${place}: macros ${energyText(warning.macroKcal, energy)} vs target ${energyText(warning.calories, energy)} (${sign}${energyText(Math.abs(warning.differenceKcal), energy)})`
}
