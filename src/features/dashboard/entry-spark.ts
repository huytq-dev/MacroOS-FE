/** Số lần ghi tối đa của đường nhỏ "Last 7 Entries". */
export const SPARK_ENTRIES = 7
const PAD_X = 6
const TOP = 7
const BOTTOM_GAP = 7
/** Thang y không hẹp hơn 1,25% mức trung bình của chính chuỗi: dao động nhỏ không thành đường dốc. */
const MIN_SPAN_RATIO = 0.0125

export interface EntrySparkPoint {
  readonly x: number
  readonly y: number
}

/** Đổi giá trị → y (px) trong khung cao `height`: tự co giãn theo min–max của chính dữ liệu (không bắt đầu từ 0), chuỗi phẳng nằm giữa. */
export function sparkY(values: readonly number[], height: number) {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const mid = (hi + lo) / 2
  const span = Math.max(hi - lo, Math.abs(mid) * MIN_SPAN_RATIO)
  const top = TOP
  const bottom = height - BOTTOM_GAP
  const center = (top + bottom) / 2
  return (value: number) => (span === 0 ? center : center - ((value - mid) / span) * (bottom - top))
}

/**
 * Điểm của đường nhỏ một chỉ số (cũ → mới): MỖI lần ghi đúng MỘT điểm (không thêm, không nội suy), cách đều nhau theo thứ tự ghi như
 * MacroFactor, ghi cuối ở mép phải: bước = (bề rộng − lề) / 6 nên ít lần ghi thì đường ngắn nằm bên phải, đủ 7 lần thì trải hết bề rộng.
 * Chỉ lấy tối đa 7 giá trị CUỐI (mới nhất); một giá trị chỉ có một điểm.
 */
export function entrySparkPoints(
  values: readonly number[],
  width: number,
  height: number
): EntrySparkPoint[] {
  if (width <= 0 || height <= 0) return []
  const shown = values.slice(-SPARK_ENTRIES)
  if (shown.length === 0) return []
  const step = (width - 2 * PAD_X) / (SPARK_ENTRIES - 1)
  const y = sparkY(shown, height)
  const last = width - PAD_X
  return shown.map((value, index) => ({ x: last - (shown.length - 1 - index) * step, y: y(value) }))
}
