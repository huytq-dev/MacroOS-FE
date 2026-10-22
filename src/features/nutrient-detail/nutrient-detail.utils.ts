import type { DayOfWeek } from '@/config/enums'
import { bucketEnd, bucketKey, type Averaging } from '@/features/dashboard/expenditure.utils'
import { NUTRIENT_GROUPS } from '@/features/dashboard/nutrient-catalog'
import { NUTRIENT_CODE } from '@/features/dashboard/nutrient-codes'
import type { NutrientDef, NutrientGroup } from '@/features/dashboard/types/dashboard.types'
import { nutrientTone } from '@/features/nutrition/nutrient-display'
import type { EnergyUnit, Measure } from '@/lib/units'
import type {
  NutrientDayResponse,
  NutrientSeriesDay,
  NutrientSeriesPoint,
} from './types/nutrient-detail.types'

/** Một chất đã ghép: định nghĩa trong danh mục, nhóm, mã BE và màu (biến CSS cho SVG, lớp nền cho thanh). */
export interface NutrientInfo {
  readonly nutrient: NutrientDef
  readonly group: NutrientGroup
  /** Mã của BE (`GET /nutrients/{code}/...`). */
  readonly code: string
  /** Biến CSS của màu chất, dùng cho cột / dải trong SVG. */
  readonly color: string
  /** Lớp nền literal cho thanh `NutrientGoalBar`. */
  readonly tone: string
}

const MACRO_COLOR: Readonly<Record<string, string>> = {
  calories: 'var(--mf-tile-calories)',
  protein: 'var(--mf-tile-protein)',
  fat: 'var(--mf-tile-fat)',
  carbs: 'var(--mf-tile-carbs)',
}
const GROUP_COLOR: Readonly<Record<string, string>> = {
  carb: 'var(--mf-tile-carbs)',
  fat: 'var(--mf-tile-fat)',
  protein: 'var(--mf-tile-protein)',
  vitamins: 'var(--mf-vitamins)',
  minerals: 'var(--mf-minerals)',
  other: 'var(--mf-tile-calories)',
}

/** Tìm chất theo khoá danh mục (calories, protein, vitaminC…); "macros" (ô tổng hợp) và khoá lạ trả null. */
export function findNutrient(key: string): NutrientInfo | null {
  const code = NUTRIENT_CODE[key]
  if (!code) return null
  for (const group of NUTRIENT_GROUPS) {
    const nutrient = group.nutrients.find((item) => item.key === key)
    if (nutrient)
      return {
        nutrient,
        group,
        code,
        color: MACRO_COLOR[key] ?? GROUP_COLOR[group.key] ?? 'var(--mf-tile-calories)',
        tone: nutrientTone(key, group.tone),
      }
  }
  return null
}

/**
 * Calo (đơn vị 'kcal' của danh mục) hiện theo kcal / kJ của user: trả `info` mang đơn vị hiển thị và hệ số đổi số của BE (kcal) sang số
 * hiển thị; chất khác (g, mg, mcg) hệ số 1. Trang chi tiết đổi MỌI số bằng hệ số này TRƯỚC khi vẽ để trục, chú thích và danh sách cùng
 * một đơn vị (thanh và % không đổi vì chỉ phụ thuộc tỉ lệ).
 */
export function displayNutrient(info: NutrientInfo, energy: Measure<EnergyUnit>) {
  if (info.nutrient.unit !== 'kcal') return { info, factor: 1 }
  return {
    info: { ...info, nutrient: { ...info.nutrient, unit: energy.unit } },
    factor: energy.convert(1),
  }
}

const scaled = (value: number | null, factor: number) => (value === null ? null : value * factor)

/** Một ngày của chuỗi với mọi lượng / mốc nhân `factor` (1 = giữ nguyên). */
export const scaleSeriesDay = (day: NutrientSeriesDay, factor: number): NutrientSeriesDay =>
  factor === 1
    ? day
    : {
        ...day,
        amount: scaled(day.amount, factor),
        floor: scaled(day.floor, factor),
        target: scaled(day.target, factor),
        ceiling: scaled(day.ceiling, factor),
      }

/** Phản hồi một ngày với mọi lượng / mốc / trung bình / món đóng góp / theo giờ nhân `factor` (1 = giữ nguyên). */
export const scaleDayResponse = (day: NutrientDayResponse, factor: number): NutrientDayResponse =>
  factor === 1
    ? day
    : {
        ...day,
        amount: scaled(day.amount, factor),
        floor: scaled(day.floor, factor),
        target: scaled(day.target, factor),
        ceiling: scaled(day.ceiling, factor),
        pastWeekAverage: scaled(day.pastWeekAverage, factor),
        pastMonthAverage: scaled(day.pastMonthAverage, factor),
        contributors: day.contributors.map((item) => ({ ...item, amount: item.amount * factor })),
        timing: day.timing.map((bucket) => ({ ...bucket, amount: bucket.amount * factor })),
      }

const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

/**
 * Gộp theo tuần (bắt đầu từ `weekStartDay` của user) / tháng: lượng = trung bình các ngày ĐÃ LOG của nhóm (null khi nhóm không có ngày nào),
 * mốc = của ngày cuối nhóm; điểm đặt ở ngày đầu nhóm. Đầu vào tăng dần theo ngày. Gộp ở FE vì bucket BE chỉ có trung bình và target trung
 * bình, không có floor / ceiling / goalKind mà biểu đồ vẽ.
 */
export function averageNutrientDays(
  days: readonly NutrientSeriesPoint[],
  averaging: Averaging,
  weekStartDay: DayOfWeek
): NutrientSeriesPoint[] {
  if (averaging === 'daily') return [...days]
  const groups = new Map<string, NutrientSeriesPoint[]>()
  for (const day of days) {
    const key = bucketKey(day.date, averaging, weekStartDay)
    groups.set(key, [...(groups.get(key) ?? []), day])
  }
  return [...groups.entries()].map(([date, group]) => {
    const logged = group.flatMap((day) =>
      day.amount === null || day.isIncomplete ? [] : [day.amount]
    )
    const last = group[group.length - 1]
    return {
      date,
      end: bucketEnd(date, averaging),
      days: logged.length,
      amount: logged.length === 0 ? null : mean(logged),
      floor: last.floor,
      target: last.target,
      ceiling: last.ceiling,
      // Loại mục tiêu quyết định mốc nào được vẽ (Minimum không trần, Maximum chỉ trần…): mất nó thì thanh / biểu đồ suy sai
      goalKind: last.goalKind,
    }
  })
}

/** Trung bình các ngày đã log trong khung (số lớn đầu trang; ngày chưa đủ không tính, như BE); null khi chưa có ngày nào. */
export function averageLogged(days: readonly NutrientSeriesDay[]): number | null {
  const logged = days.flatMap((day) =>
    day.amount === null || day.isIncomplete ? [] : [day.amount]
  )
  return logged.length === 0 ? null : mean(logged)
}
