import type { RangeKey } from '../expenditure.utils'
import { addDaysIso } from '@/lib/date'

export const WIDTH = 360
export const PAD = { left: 4, right: 40, top: 14, bottom: 28 }
export const PLOT_W = WIDTH - PAD.left - PAD.right
/** Phần chiều rộng biểu đồ dành cho vùng vẽ (còn lại là lề và nhãn trục kg / kcal bên phải). */
export const PLOT_FRACTION = PLOT_W / WIDTH

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const RANGE_DAYS: Record<Exclude<RangeKey, 'All'>, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 91,
  '6M': 182,
  '1Y': 365,
}

const parse = (iso: string) => new Date(`${iso}T00:00:00`)
export const daysBetween = (from: string, to: string) =>
  Math.round((parse(to).getTime() - parse(from).getTime()) / 864e5)

/** Số ô ngày của một kỳ; All = toàn bộ dữ liệu (tối thiểu 7). */
export const slotsOf = (range: RangeKey, totalDays: number) =>
  range === 'All' ? Math.max(totalDays, 7) : RANGE_DAYS[range]

/** Khoảng đang xem: kết thúc `snapped` ngày trước hôm nay, dài `slots` ngày. */
export const viewWindow = (today: string, slots: number, snapped: number) => {
  const to = addDaysIso(today, -snapped)
  return { from: addDaysIso(to, -(Math.round(slots) - 1)), to }
}

/** Số ngày lùi so với hôm nay của một ngày (0 = hôm nay). */
export const agoOf = (today: string, date: string) => daysBetween(date, today)

/**
 * Toạ độ x của ngày cách hôm nay `ago` ngày: neo bên PHẢI (hôm nay ở ô cuối khi chưa kéo), mỗi ô rộng PLOT_W / slots. `slots` và `pos`
 * là số thực nên cùng một công thức cho cả kéo ngang (pos) lẫn giãn nở khi đổi kỳ (slots chạy từ kỳ cũ sang kỳ mới).
 */
export const xOfAgo = (ago: number, slots: number, pos: number) =>
  PAD.left + PLOT_W - (PLOT_W / slots) * (ago - pos + 0.5)

/** Khoảng `ago` đang hiện (rộng thêm một ô mỗi bên để phần chạm mép vẫn được vẽ rồi bị cắt bởi vùng vẽ). */
export const visibleAgo = (slots: number, pos: number) => ({
  min: Math.floor(pos) - 1,
  max: Math.ceil(pos + slots) + 1,
})

export interface AxisLabel {
  readonly key: string
  readonly x: number
  readonly text: string
}

const epochDay = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / 864e5)

/**
 * Nhãn trục x: kỳ ngắn (≤ 7 ô) ghi thứ từng ngày; kỳ dài ghi "Oct 15" thưa dần theo số ô. Gắn theo NGÀY (không theo vị trí) nên khi
 * kéo ngang nhãn trượt theo cột chứ không nhảy.
 */
export function axisLabels(today: string, slots: number, pos: number): AxisLabel[] {
  const { min, max } = visibleAgo(slots, pos)
  const step = slots <= 7.5 ? 1 : Math.max(1, Math.round(slots / 5))
  const labels: AxisLabel[] = []
  for (let ago = Math.max(min, 0); ago <= max; ago += 1) {
    const date = addDaysIso(today, -ago)
    if (step > 1 && epochDay(date) % step !== 0) continue
    const d = parse(date)
    labels.push({
      key: date,
      x: xOfAgo(ago, slots, pos),
      text:
        slots <= 7.5
          ? WEEKDAYS[d.getDay()]
          : `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`,
    })
  }
  return labels
}
