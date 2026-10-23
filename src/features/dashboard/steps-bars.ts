import { lastDays } from './dashboard.utils'

/** Một ngày của ô Steps: `steps` null = KHÔNG có bản ghi (khác với 0 bước đã ghi). */
export interface StepsTileDay {
  readonly date: string
  readonly steps: number | null
}

export const STEPS_COLUMNS = 7
/** Khoảng hở giữa hai cột = 50% bề rộng một cột (đo từ ảnh MF: cột ≈ 11.5 px, hở ≈ 6 px, bảy cột trải hết bề rộng nội dung ô). */
const GAP = 0.5
/** Sàn nhìn thấy được (px) của một cột có số bước rất nhỏ so với ngày cao nhất; chỉ để cột không biến mất, không phải thang đo. */
const MIN_BAR_PX = 2

export interface StepsBarRect {
  readonly date: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * 7 ngày lịch kết thúc HÔM NAY (cũ → mới) cho ô Steps, lấy số từ `items` của `GET /steps` (BE trả theo từng ngày). Ngày không có bản ghi là
 * `steps: null`; bản ghi ngoài 7 ngày này (ngày cũ hơn hoặc tương lai) không vào ô.
 */
export function stepsWeekOf(
  items: readonly { readonly logDate: string; readonly steps: number }[] | undefined,
  today: string
): StepsTileDay[] {
  const byDate = new Map((items ?? []).map((item) => [item.logDate, item.steps]))
  return lastDays(today, STEPS_COLUMNS).map((date) => ({ date, steps: byDate.get(date) ?? null }))
}

/**
 * Số ở chân ô: số bước của HÔM NAY (theo múi giờ user) từ CÙNG danh sách với các cột; hôm nay chưa có bản ghi thì null ("---", không thành 0), bản ghi 0 bước thật thì 0.
 * Quyết định của user (dựa trên ảnh MacroFactor, chưa phải công thức MF được xác minh); trang chi tiết vẫn có "Average" riêng.
 */
export const stepsTodayOf = (days: readonly StepsTileDay[]): number | null =>
  days.length === 0 ? null : days[days.length - 1].steps

/**
 * Hình học các cột (px) trong vùng `width` × `height`: bảy cột trải hết bề rộng theo thứ tự thời gian (hôm nay ở mép phải), cao tỉ lệ số bước so với
 * ngày cao nhất (thang 0 → max), mọc từ đáy. Một ngày có dữ liệu cũng vẽ (cao hết vùng); ngày không có bản ghi không có cột; chưa ngày nào có
 * số thì không có cột nào. Không đo từ kích thước bằng 0: `width` hoặc `height` ≤ 0 thì không vẽ.
 */
export function stepsBarRects(
  days: readonly StepsTileDay[],
  width: number,
  height: number
): StepsBarRect[] {
  if (width <= 0 || height <= 0) return []
  const top = Math.max(0, ...days.map((day) => day.steps ?? 0))
  const bar = width / (STEPS_COLUMNS + (STEPS_COLUMNS - 1) * GAP)
  const offset = STEPS_COLUMNS - days.length
  return days.flatMap((day, index): StepsBarRect[] => {
    // null = không có dữ liệu, 0 = bản ghi thật nhưng chiều cao 0: cả hai không vẽ bar (user: không vạch giả)
    if (day.steps === null || day.steps <= 0) return []
    const barHeight = Math.max(MIN_BAR_PX, (day.steps / top) * Math.max(0, height - 2))
    return [
      {
        date: day.date,
        x: (index + offset) * bar * (1 + GAP),
        y: height - barHeight,
        width: bar,
        height: barHeight,
      },
    ]
  })
}
