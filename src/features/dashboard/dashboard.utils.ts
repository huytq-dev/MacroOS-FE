import type { WeekDay } from '@/features/food-log/types/food-log.types'
import { shownTotals } from '@/features/food-log/effective'
import { shownProgress } from '@/features/nutrition/remaining'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { addDaysIso } from '@/lib/date'
import { DAYS_PER_WEEK } from '@/lib/week'
import type { DailyProgress, NutrientValue } from './types/dashboard.types'

export const HABIT_DAYS = 30

/**
 * Trạng thái của một trang / ô chi tiết đọc HAI truy vấn (chuỗi + insights): đang tải tới khi cả hai về; một trong hai lỗi là lỗi — TanStack giữ số cũ khi
 * tải lại lỗi, số đó có thể là số trước khi BE dựng lại nên không được hiện như số cuối.
 */
export const pairStatus = (
  series: { readonly isPending: boolean; readonly isError: boolean; readonly isFetching: boolean },
  insights: { readonly isPending: boolean; readonly isError: boolean; readonly isFetching: boolean }
) => ({
  isLoading: series.isPending || insights.isPending,
  isError: series.isError || insights.isError,
  // Đang tải lại (vd. sau "Try again"): ErrorState khoá nút và báo đang thử, không huỷ request đang chạy để gửi request khác
  isFetching: series.isFetching || insights.isFetching,
})

/**
 * `count` mục MỚI NHẤT theo ngày, xếp cũ → mới (thứ tự vẽ đường nhỏ). Không dựa vào thứ tự BE trả: `GET /weights` và Visual Body Fat
 * trả mới → cũ, nên `slice(-count)` thẳng trên danh sách đó lấy nhầm các mục CŨ NHẤT.
 */
export function latestByDate<T>(items: readonly T[], dateOf: (item: T) => string, count: number) {
  return [...items].sort((a, b) => dateOf(a).localeCompare(dateOf(b))).slice(-count)
}

/** Một lần đo (cm) trong chuỗi số đo của BE, dùng cho tỉ lệ cơ thể. */
interface BodyMeasure {
  readonly date: string
  readonly valueCm: number
}

export interface BodyRatioPoint {
  readonly date: string
  readonly ratio: number
}

/**
 * Tỉ lệ cơ thể ở MỖI lần đo vòng eo (giữ thứ tự đầu vào, mới → cũ như BE): Waist to Height = eo ÷ chiều cao trong hồ sơ; Waist to Hip =
 * eo ÷ hông ĐO CÙNG NGÀY (ngày không có hông thì bỏ). Số lớn của ô và đường nhỏ cùng đọc danh sách này, nên không bao giờ lấy eo của
 * ngày này chia hông của ngày khác.
 */
export function bodyRatios(
  kind: 'waistToHeight' | 'waistToHip',
  waist: readonly BodyMeasure[],
  hips: readonly BodyMeasure[],
  heightCm: number | null
): BodyRatioPoint[] {
  return waist.flatMap((entry) => {
    const divisor =
      kind === 'waistToHeight'
        ? heightCm
        : (hips.find((item) => item.date === entry.date)?.valueCm ?? null)
    return divisor ? [{ date: entry.date, ratio: entry.valueCm / divisor }] : []
  })
}

/** Ngày có log theo BE (`isLogged`, gồm cả ngày nhịn ăn 0 kcal): không tự suy từ số kcal. */
export const isLogged = (point: DailyProgress) => point.isLogged

/** `count` ngày kết thúc ở `today`, cũ → mới. */
export const lastDays = (today: string, count: number) =>
  Array.from({ length: count }, (_, index) => addDaysIso(today, index - count + 1))

/** 30 ô cho lưới thói quen, cũ → mới; ô cuối là hôm nay. */
export const habitCells = (done: ReadonlySet<string>, today: string) =>
  lastDays(today, HABIT_DAYS).map((date) => done.has(date))

/** Số ngày có thực hiện trong 7 ngày gần nhất (hiện "x/7 tuần này"). */
export const weekCount = (done: ReadonlySet<string>, today: string) =>
  lastDays(today, DAYS_PER_WEEK).filter((date) => done.has(date)).length

/**
 * Số lớn ở cột tổng bên phải lưới Weekly Nutrition cho MỘT chất: cả tuần hoặc một ngày đang chọn (`scope`). Consumed = tổng đã ăn của MỌI ngày đã qua (kể cả ngày có target cũ chưa xác minh:
 * trước đây các ngày đó bị loại nên tổng cả tuần chỉ còn hôm nay); mục tiêu / Remaining CHỈ tính các ngày có target chính thức (`day.target`): target cũ chưa xác minh
 * (BE LEGACY_UNVERIFIED, `referenceTarget`) chỉ để tham khảo ở độ cao thanh, KHÔNG vào goal / remaining / tuân thủ. Remaining = tổng target các ngày chính thức − tổng đã ăn của CHÍNH các ngày đó,
 * tính bằng quy tắc chung `shownProgress` (làm tròn ở đơn vị đang hiện TRƯỚC rồi mới trừ). Ngày chưa chính thức có đã ăn > 0 thì Consumed không đi kèm "of goal" (goal null: không so tổng
 * có cả món của ngày chưa xác minh với mục tiêu chỉ của ngày chính thức). Chưa có target chính thức thì `goal` null và Remaining vẫn hiện số đã ăn. `shown` đổi + làm tròn một số của BE.
 */
export function weekSummary(
  scope: readonly WeekDay[],
  key: 'calories' | 'protein' | 'fat' | 'carbs',
  goalOf: (target: ProgramWeek) => number,
  mode: 'consumed' | 'remaining',
  shown: (value: number) => number,
  /** Hôm nay (múi giờ user): ngày SAU hôm nay (log tương lai được phép) không tính là đã ăn, chỉ target của nó vẫn nằm trong cả tuần. */
  today: string | null = null
) {
  // Số hiệu lực của BE: ngày CHƯA BIẾT số này (macro chưa nhập, null) không góp vào tổng (không coi là 0); không ngày nào biết thì "chưa biết"
  const knownOf = (days: readonly WeekDay[]) =>
    days.flatMap((day) => {
      if (today !== null && day.logDate > today) return []
      const value = shownTotals(day)[key]
      return value === null ? [] : [value]
    })
  const total = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0)
  const official = scope.filter((day) => day.target)
  const eatenAll = knownOf(scope)
  const eatenOfficial = knownOf(official)
  const goals = official.map((day) => goalOf(day.target as ProgramWeek))
  const goal = goals.length > 0 ? total(goals) : null
  if (mode === 'remaining') {
    const progress = shownProgress(total(eatenOfficial), goal, shown)
    // Không có target chính thức thì KHÔNG có "còn lại": hiện "—", không đổi sang số đã ăn (Remaining bật mà hiện số đã ăn gây hiểu nhầm)
    if (progress.remaining === null) return { value: null, goal: progress.goal }
    return { value: eatenOfficial.length === 0 ? null : progress.remaining, goal: progress.goal }
  }
  const unofficialEaten = knownOf(scope.filter((day) => !day.target)).some((value) => value > 0)
  const progress = shownProgress(total(eatenAll), unofficialEaten ? null : goal, shown)
  return { value: eatenAll.length === 0 ? null : progress.consumed, goal: progress.goal }
}

export type BalanceMode = 'targets' | 'expenditure'

/** Giá trị "hôm nay" cho các ô dinh dưỡng; chất chưa có dữ liệu thì `known: false` ("---"), không phải 0 đã biết. */
export const nutrientValue = (
  known: Readonly<Record<string, NutrientValue>>,
  key: string
): NutrientValue =>
  known[key] ?? {
    value: 0,
    floor: null,
    target: null,
    ceiling: null,
    goalKind: 'None',
    known: false,
  }
