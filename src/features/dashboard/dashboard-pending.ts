import { NUTRIENT_GROUPS } from './nutrient-catalog'

/**
 * Nguồn dữ liệu của Dashboard còn đang chờ trả lời (`isPending` của từng truy vấn). BE lạnh trả mỗi truy vấn sau 1 – 3s nên một thẻ / ô
 * KHÔNG được vẽ số của "chưa có dữ liệu" ("—", "N/A", "0/7") trong lúc nguồn của nó chưa về: nó hiện khung xám (`loading`) cho tới khi có câu trả lời.
 * "—" chỉ dành cho trường hợp thật sự không có (không có target, chưa đo lần nào).
 */
export interface DashboardPending {
  readonly weights: boolean
  readonly daily: boolean
  /** `GET /energy-balance/series` (thẻ Energy Balance). */
  readonly energyBalance: boolean
  readonly dayLog: boolean
  readonly nutrients: boolean
  readonly steps: boolean
  readonly periods: boolean
  readonly bodyFat: boolean
  readonly expenditure: boolean
}

const NUTRIENT_KEYS = new Set(
  NUTRIENT_GROUPS.flatMap((group) => group.nutrients.map((nutrient) => nutrient.key))
)

/** Calo và macro đến từ nhật ký + target của program (cùng nguồn với thẻ Daily Nutrition), phần còn lại từ `GET /nutrients`. */
const FROM_DAY_LOG = new Set(['calories', 'protein', 'fat', 'carbs'])

/**
 * Ô `key` của bố cục còn chờ dữ liệu không. Các ô tự có truy vấn riêng (Expenditure, Weight Trend, Energy Balance, Goal Progress, ảnh, Full Body,
 * số đo) tự hiện khung xám của mình nên ở đây là false.
 */
export const tilePending = (key: string, pending: DashboardPending): boolean => {
  switch (key) {
    case 'weighIn':
    case 'scaleWeight':
      return pending.weights
    case 'foodLogging':
      return pending.daily
    case 'bodyFat':
      return pending.bodyFat
    case 'steps':
      return pending.steps
    case 'period':
      return pending.periods
    case 'macros':
      return pending.dayLog || pending.daily
    case 'fiber':
      return pending.dayLog || pending.nutrients
    default:
      if (FROM_DAY_LOG.has(key)) return pending.dayLog
      return NUTRIENT_KEYS.has(key) && pending.nutrients
  }
}

/** Thẻ lớn của carousel còn chờ không: Daily Nutrition cần nhật ký (tổng + target), Energy Balance cần tiến độ 30 ngày, TDEE và target của hôm nay. */
export const focusPending = (key: 'weekly' | 'energy' | 'daily', pending: DashboardPending) =>
  key === 'daily'
    ? pending.dayLog
    : key === 'energy'
      ? pending.energyBalance || pending.expenditure || pending.dayLog
      : false
