export interface Pt {
  readonly x: number
  readonly y: number
}

interface Bezier {
  readonly c1: Pt
  readonly c2: Pt
  readonly to: Pt
}

/**
 * Đường cong đơn điệu (Fritsch–Butland, cubic Hermite) đi QUA mọi điểm và KHÔNG vọt ra ngoài khoảng giữa hai điểm liền kề (không có "sóng" giả): dùng để vẽ mép
 * trên / dưới của dải Flux mượt như MacroFactor mà vẫn giữ đúng số của BE tại từng ngày (mép luôn qua đúng fluxLower / fluxUpper). `x` phải tăng dần.
 */
export function monotoneBeziers(points: readonly Pt[]): Bezier[] {
  const n = points.length
  if (n < 2) return []
  const h: number[] = []
  const d: number[] = []
  for (let k = 0; k < n - 1; k += 1) {
    h.push(points[k + 1].x - points[k].x)
    d.push((points[k + 1].y - points[k].y) / (h[k] || 1))
  }
  const m: number[] = new Array<number>(n).fill(0)
  m[0] = d[0]
  m[n - 1] = d[n - 2]
  for (let k = 1; k < n - 1; k += 1) {
    if (d[k - 1] * d[k] <= 0) m[k] = 0
    else {
      const w1 = 2 * h[k] + h[k - 1]
      const w2 = h[k] + 2 * h[k - 1]
      m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k])
    }
  }
  return h.map((width, k) => ({
    c1: { x: points[k].x + width / 3, y: points[k].y + (m[k] * width) / 3 },
    c2: { x: points[k + 1].x - width / 3, y: points[k + 1].y - (m[k + 1] * width) / 3 },
    to: points[k + 1],
  }))
}

const fmt = (value: number) => Math.round(value * 100) / 100
const pair = (point: Pt) => `${fmt(point.x)},${fmt(point.y)}`

/** Đoạn "C…" nối từ điểm đầu tới điểm cuối của `points` (không gồm lệnh M đầu). */
export const forwardPath = (points: readonly Pt[]): string =>
  monotoneBeziers(points)
    .map((b) => `C${pair(b.c1)} ${pair(b.c2)} ${pair(b.to)}`)
    .join('')

/** Cùng đường cong nhưng đi NGƯỢC (từ điểm cuối về điểm đầu): hoán đổi hai điểm điều khiển của từng đoạn. */
export const backwardPath = (points: readonly Pt[]): string =>
  monotoneBeziers(points)
    .map((b, k) => `C${pair(b.c2)} ${pair(b.c1)} ${pair(points[k])}`)
    .reverse()
    .join('')

/**
 * Dải giữa mép trên và mép dưới (cùng danh sách x, tăng dần): mép trên đi từ trái sang phải, một nét thẳng đứng xuống mép dưới, mép dưới đi ngược về, khép kín.
 * Một điểm duy nhất thì là hình chữ nhật rộng `halfWidth` mỗi bên (vẫn thấy được thay vì mất).
 */
export function bandPath(upper: readonly Pt[], lower: readonly Pt[], halfWidth: number): string {
  if (upper.length === 0 || upper.length !== lower.length) return ''
  if (upper.length === 1) {
    const [u] = upper
    const [l] = lower
    return `M${pair({ x: u.x - halfWidth, y: u.y })}L${pair({ x: u.x + halfWidth, y: u.y })}L${pair({ x: l.x + halfWidth, y: l.y })}L${pair({ x: l.x - halfWidth, y: l.y })}Z`
  }
  return `M${pair(upper[0])}${forwardPath(upper)}L${pair(lower[lower.length - 1])}${backwardPath(lower)}Z`
}
