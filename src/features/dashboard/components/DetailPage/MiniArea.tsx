import { cn } from '@/lib/utils'

const W = 56
const H = 20
const TOP = 3
const BOTTOM = 18

interface MiniAreaProps {
  /**
   * Một giá trị cho MỖI ngày của cửa sổ, cũ → mới; `null` = ngày chưa có dữ liệu (để trống). Cửa sổ N ngày có N + 1 ô nên điểm cuối
   * luôn là ngày hôm nay và phần thiếu nằm bên trái.
   */
  readonly values: readonly (number | null)[]
  /** Màu theo `currentColor` (vd. `text-mf-purple`). */
  readonly className?: string
}

/**
 * Biểu đồ vùng thu nhỏ đúng dữ liệu của cửa sổ: nét trên đậm + vùng tô mờ bên dưới, tự co giãn theo min–max RIÊNG của hàng (chuỗi
 * phẳng nằm giữa khung); ngày thiếu dữ liệu không vẽ. Tự vẽ từ trái sang khi hiện.
 */
export function MiniArea({ values, className }: MiniAreaProps) {
  const known = values.flatMap((value, index) => (value === null ? [] : [{ index, value }]))
  const slots = Math.max(values.length - 1, 1)
  const lo = known.length ? Math.min(...known.map((point) => point.value)) : 0
  const span = known.length ? Math.max(...known.map((point) => point.value)) - lo : 0
  const x = (index: number) => (index / slots) * W
  const y = (value: number) =>
    span === 0 ? (TOP + BOTTOM) / 2 : BOTTOM - ((value - lo) / span) * (BOTTOM - TOP)
  const line = known
    .map((point, order) => `${order === 0 ? 'M' : 'L'} ${x(point.index)} ${y(point.value)}`)
    .join(' ')
  const first = known[0]
  const last = known[known.length - 1]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className={cn('motion-safe:animate-chart-grow h-5 w-14 origin-left', className)}
    >
      {known.length > 1 && first && last && (
        <>
          <path
            d={`${line} L ${x(last.index)} ${H} L ${x(first.index)} ${H} Z`}
            fill="currentColor"
            opacity="0.28"
          />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      )}
      {known.length === 1 && first && (
        <circle cx={x(first.index)} cy={y(first.value)} r="1.8" fill="currentColor" />
      )}
    </svg>
  )
}

/** Đệm bên trái bằng `null` cho đủ N + 1 ô (ngày chưa có dữ liệu), giữ ngày hôm nay ở ô cuối. */
export const padWindow = (values: readonly number[], span: number): (number | null)[] => [
  ...Array.from({ length: Math.max(0, span + 1 - values.length) }, () => null),
  ...values.slice(-(span + 1)),
]
