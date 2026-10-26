import { roundAway } from '@/features/weight/body-metric.utils'
import { daysBetween } from '@/lib/date'
import type { Averaging } from './expenditure.utils'
import type {
  MacroAverages,
  MacroSeriesDay,
  MacroSeriesResponse,
} from './types/macros-series.types'

/** Thứ tự xếp chồng từ đáy lên (cột) và từ trái sang phải (thanh ngang): Carbs, Fat, Protein, Other, như MacroFactor. */
export const MACRO_PARTS = ['carbs', 'fat', 'protein', 'other'] as const
export type MacroPart = (typeof MACRO_PARTS)[number]

/** Tên và màu từng phần (cùng bộ `--mf-tile-*` với ô Macros ở Dashboard); chú giải và cả hai biểu đồ đọc MỘT bảng này. */
export const MACRO_PART_STYLE: Readonly<
  Record<MacroPart, { readonly label: string; readonly fill: string; readonly bg: string }>
> = {
  carbs: { label: 'Carbs', fill: 'fill-mf-tile-carbs', bg: 'bg-mf-tile-carbs' },
  fat: { label: 'Fat', fill: 'fill-mf-tile-fat', bg: 'bg-mf-tile-fat' },
  protein: { label: 'Protein', fill: 'fill-mf-tile-protein', bg: 'bg-mf-tile-protein' },
  other: { label: 'Other', fill: 'fill-mf-tile-calories', bg: 'bg-mf-tile-calories' },
}

/**
 * Một cột / một dòng của màn Macros, mọi số là kcal CỦA BE (`GET /nutrients/macros/series`): FE không tự quy gram → kcal hay tính Other. `other` là số THÔ CÓ DẤU của
 * BE (âm khi macro nhiều hơn calo); `total` là `caloriesKcal` của BE. Điểm gộp W / M lấy từ `buckets[].averages`.
 */
export interface MacroBar {
  readonly date: string
  readonly carbs: number
  readonly fat: number
  readonly protein: number
  readonly other: number
  readonly total: number
  readonly isIncomplete?: boolean
  /** Chỉ điểm gộp W / M: ngày cuối nhóm và số ngày đã log trong nhóm. */
  readonly end?: string
  readonly days?: number
}

const barOf = (
  date: string,
  values: Pick<
    MacroAverages,
    'carbsKcal' | 'fatKcal' | 'proteinKcal' | 'otherKcal' | 'caloriesKcal'
  >,
  extra: Partial<MacroBar> = {}
): MacroBar[] =>
  values.carbsKcal === null ||
  values.fatKcal === null ||
  values.proteinKcal === null ||
  values.otherKcal === null ||
  values.caloriesKcal === null
    ? []
    : [
        {
          date,
          carbs: values.carbsKcal,
          fat: values.fatKcal,
          protein: values.proteinKcal,
          other: values.otherKcal,
          total: values.caloriesKcal,
          ...extra,
        },
      ]

/**
 * Các cột của biểu đồ (cũ → mới) từ phản hồi BE: D = mỗi ngày ĐÃ LOG (ngày chưa log có mọi giá trị null nên không có cột; ngày nhịn ăn là cột 0), W / M = các
 * bucket BE (chỉ bucket có ngày log), đặt ở ngày đầu nhóm.
 */
export function macroBarsOf(series: MacroSeriesResponse, averaging: Averaging): MacroBar[] {
  if (averaging !== 'daily')
    return series.buckets.flatMap((bucket) =>
      barOf(bucket.start, bucket.averages, { end: bucket.end, days: bucket.loggedDays })
    )
  return series.days.flatMap((day) =>
    day.isLogged ? barOf(day.date, day, { isIncomplete: day.isIncomplete }) : []
  )
}

/** Số ngày của toàn lịch sử (ngày đầu trong phản hồi → hôm nay, tính cả hai đầu); BE trả `days` rỗng (chưa log ngày nào) → 1: chỉ hôm nay, biểu đồ / danh sách trống. */
export const historyDayCount = (series: MacroSeriesResponse, today: string) => {
  const first = series.days[0]?.date
  return first ? daysBetween(first, today) + 1 : 1
}

/** Phần kcal được VẼ của một cột: Other chỉ khi > 0 (Other âm chờ quyết định của user: chưa vẽ, số thật vẫn nằm trong `bar.other`). */
export const drawnKcal = (bar: MacroBar, part: MacroPart) => Math.max(0, bar[part])

/** Chiều cao cột = tổng các phần được vẽ (bằng `total` của BE khi Other ≥ 0). */
export const stackTotal = (bar: MacroBar) =>
  MACRO_PARTS.reduce((sum, part) => sum + drawnKcal(bar, part), 0)

/**
 * % calo của một phần trong ngày theo ĐÚNG công thức của BE (`MacroAverages.*Percent`: kcal phần ÷ kcal tổng × 100, 1 số lẻ làm tròn ra xa 0); null khi kcal tổng ≤ 0
 * (không chia cho 0). Không kẹp: P / F / C luôn là số thật, kể cả khi Other âm làm tổng ≠ 100.
 */
export const percentOf = (kcal: number, total: number) =>
  total > 0 ? roundAway((kcal / total) * 100, 1) : null

/** Chữ "7%" hiển thị của một phần (số nguyên như MacroFactor, làm tròn từ số 1 chữ số của BE); không có kcal tổng → "0%". */
export const percentText = (bar: MacroBar, part: MacroPart) => {
  const percent = percentOf(bar[part], bar.total)
  return `${percent === null ? 0 : roundAway(percent, 0)}%`
}

/** Số gram trung bình hiển thị của ô tóm tắt: số nguyên từ trung bình của BE; null (không ngày log) → "---". */
export const gramText = (grams: number | null | undefined) =>
  grams === null || grams === undefined ? null : String(roundAway(grams, 0))

/**
 * Cột của MỘT ngày (null = ngày chưa log / không có trong phản hồi) từ cùng phản hồi BE: ô Macros 7 ngày ở Dashboard và màn Macros Detail đọc CÙNG hàm này và
 * cùng `drawnKcal` / `stackTotal` để vẽ nên không bao giờ tính Other khác nhau.
 */
export const macroBarOn = (series: MacroSeriesResponse, date: string): MacroBar | null => {
  const day = series.days.find((item) => item.date === date)
  return day?.isLogged
    ? (barOf(day.date, day, { isIncomplete: day.isIncomplete })[0] ?? null)
    : null
}

/**
 * Ngày ĐÃ LOG mà BE không có đủ phân tích macro (chỉ calories, chỉ macro, hoặc thiếu một macro): không vẽ cột (không có Other = tổng kcal, không có P / F / C = 0) nhưng vẫn
 * phải thấy trong lịch sử với số BE có (null = "—"). `isLogged` false (chưa log) không thuộc nhóm này.
 */
export interface MacroPartialDay {
  readonly date: string
  readonly caloriesKcal: number | null
  readonly proteinG: number | null
  readonly fatG: number | null
  readonly carbsG: number | null
  readonly isIncomplete: boolean
}

const hasFullBreakdown = (day: MacroSeriesDay) =>
  day.carbsKcal !== null &&
  day.fatKcal !== null &&
  day.proteinKcal !== null &&
  day.otherKcal !== null &&
  day.caloriesKcal !== null

export const partialDaysOf = (series: MacroSeriesResponse): MacroPartialDay[] =>
  series.days.flatMap((day) =>
    day.isLogged && !hasFullBreakdown(day)
      ? [
          {
            date: day.date,
            caloriesKcal: day.caloriesKcal,
            proteinG: day.proteinG,
            fatG: day.fatG,
            carbsG: day.carbsG,
            isIncomplete: day.isIncomplete,
          },
        ]
      : []
  )
