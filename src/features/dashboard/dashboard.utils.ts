import { addDaysIso } from '@/lib/date'
import type { DailyProgress, NutrientValue } from './types/dashboard.types'

export const HABIT_DAYS = 30
export const WEEK_DAYS = 7

/** Ngày có log: BE sẽ trả `isLogged`; chưa có thì coi "đã ăn > 0 kcal" là có log. */
export const isLogged = (point: DailyProgress) => point.isLogged ?? point.caloriesConsumed > 0

/** `count` ngày kết thúc ở `today`, cũ → mới. */
export const lastDays = (today: string, count: number) =>
  Array.from({ length: count }, (_, index) => addDaysIso(today, index - count + 1))

/** 30 ô cho lưới thói quen, cũ → mới; ô cuối là hôm nay. */
export const habitCells = (done: ReadonlySet<string>, today: string) =>
  lastDays(today, HABIT_DAYS).map((date) => done.has(date))

/** Số ngày có thực hiện trong 7 ngày gần nhất (hiện "x/7 tuần này"). */
export const weekCount = (done: ReadonlySet<string>, today: string) =>
  lastDays(today, WEEK_DAYS).filter((date) => done.has(date)).length

export type BalanceMode = 'targets' | 'expenditure'

export interface EnergyBalanceSummary {
  /** Trung bình đã ăn trên các ngày có log; null = chưa log ngày nào (hiện N/A). */
  readonly nutrition: number | null
  /** Trung bình target (hoặc TDEE) trên các ngày có log. */
  readonly baseline: number | null
  /** nutrition − baseline; dương = thặng dư. */
  readonly difference: number | null
}

/** Cân bằng năng lượng: chỉ tính các ngày có log (ngày chưa log không kéo trung bình xuống). */
export function energyBalance(
  points: readonly DailyProgress[],
  mode: BalanceMode,
  fallbackTdee: number | null,
  fallbackTarget: number | null
): EnergyBalanceSummary {
  const logged = points.filter(isLogged)
  // Chưa log ngày nào: vẫn hiện target/tiêu hao hiện tại để người dùng thấy mốc so sánh (như MacroFactor).
  if (logged.length === 0)
    return {
      nutrition: null,
      baseline: mode === 'targets' ? fallbackTarget : fallbackTdee,
      difference: null,
    }
  const mean = (values: readonly number[]) =>
    Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
  const baselines = logged
    .map((point) =>
      mode === 'targets' ? point.caloriesTarget : (point.estimatedTdeeKcal ?? fallbackTdee)
    )
    .filter((value): value is number => value !== null && value > 0)
  const nutrition = mean(logged.map((point) => point.caloriesConsumed))
  const baseline = baselines.length > 0 ? mean(baselines) : null
  return { nutrition, baseline, difference: baseline === null ? null : nutrition - baseline }
}

/** % quãng đường từ cân lúc bắt đầu tới cân mục tiêu; null khi thiếu dữ liệu hoặc mục tiêu trùng cân bắt đầu. */
export function goalProgressPercent(
  startKg: number | null,
  currentKg: number | null,
  targetKg: number | null | undefined
) {
  if (startKg === null || currentKg === null || targetKg == null || startKg === targetKg)
    return null
  const done = (startKg - currentKg) / (startKg - targetKg)
  return Math.round(Math.min(1, Math.max(0, done)) * 100)
}

/** Giá trị "hôm nay" cho các ô dinh dưỡng; thiếu trong `known` thì 0 với target chưa có. */
export const nutrientValue = (
  known: Readonly<Record<string, NutrientValue>>,
  key: string
): NutrientValue => known[key] ?? { value: 0, target: null }
