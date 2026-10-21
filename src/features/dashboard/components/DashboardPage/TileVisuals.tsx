import { cn } from '@/lib/utils'
import type { MacroStackDay } from '../../types/dashboard.types'

const WIDTH = 120
const HEIGHT = 44
const TOP = 7
const BOTTOM = 37

/** Đổi giá trị → toạ độ y: tự co giãn theo min–max của chính dữ liệu (không bắt đầu từ 0); chuỗi phẳng nằm giữa khung. */
const yOf = (values: readonly number[]) => {
  const min = Math.min(...values)
  const span = Math.max(...values) - min
  return (value: number) =>
    span === 0 ? (TOP + BOTTOM) / 2 : BOTTOM - ((value - min) / span) * (BOTTOM - TOP)
}

const xOf = (index: number, count: number) =>
  count === 1 ? WIDTH - 10 : 8 + (index / (count - 1)) * (WIDTH - 16)

/** Đường cong mượt đi qua các điểm (trung điểm làm điểm neo, điểm thật làm điểm điều khiển). */
const smoothPath = (points: readonly { x: number; y: number }[]) => {
  const middle = (a: number, b: number) => (a + b) / 2
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index]
    const next = points[index + 1]
    path += ` Q ${point.x} ${point.y} ${middle(point.x, next.x)} ${middle(point.y, next.y)}`
  }
  const last = points[points.length - 1]
  return `${path} L ${last.x} ${last.y}`
}

interface SparklineProps {
  /** Giá trị đường xu hướng (cũ → mới). */
  readonly values: readonly number[]
  /** Số đo thô cùng thứ tự với `values`, vẽ thành chấm nhỏ mờ quanh đường (cân thật quanh đường trend). */
  readonly raw?: readonly number[]
  readonly className?: string
}

/**
 * Đường xu hướng nhỏ kiểu MacroFactor: đường mảnh mượt tự co giãn theo min–max (có cả số đo thô thì thang gồm cả chúng), số đo thô là
 * chấm nhỏ mờ, hai đầu đường là vòng tròn rỗng (một điểm thì chỉ có vòng tròn bên phải). Màu theo `currentColor`; đường tự vẽ khi xuất hiện.
 */
export function Sparkline({ values, raw, className }: SparklineProps) {
  if (values.length === 0) return <div className="h-12" aria-hidden="true" />
  const y = yOf(raw ? [...values, ...raw] : values)
  const points = values.map((value, index) => ({ x: xOf(index, values.length), y: y(value) }))
  const ends = points.length > 1 ? [points[0], points[points.length - 1]] : points
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      className={cn('h-12 w-full', className)}
    >
      {raw?.map((value, index) => (
        <circle
          key={index}
          cx={xOf(index, raw.length)}
          cy={y(value)}
          r="1.5"
          fill="currentColor"
          opacity="0.4"
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500"
        />
      ))}
      {points.length > 1 && (
        <path
          d={smoothPath(points)}
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="motion-safe:animate-chart-draw"
        />
      )}
      {ends.map((point) => (
        <circle
          key={point.x}
          cx={point.x}
          cy={point.y}
          r="2.8"
          fill="var(--card)"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      ))}
    </svg>
  )
}

/** Thứ tự xếp chồng từ đáy lên và màu từng phần (cùng bộ `--mf-tile-*` với các thanh Calories / Protein / Fat / Carbs). */
const STACK_SEGMENTS = [
  ['carbs', 'fill-mf-tile-carbs'],
  ['fat', 'fill-mf-tile-fat'],
  ['protein', 'fill-mf-tile-protein'],
  ['other', 'fill-mf-tile-calories'],
] as const

/**
 * Cột chồng 7 ngày của ô Macros (như MacroFactor): mỗi ngày đã log một cột gồm carb (xanh lá), fat (vàng), protein (cam) và phần calo
 * chưa quy ra macro (xanh dương) trên cùng; ngày chưa log không có cột; thang tự co theo ngày cao nhất, cột mọc lên từ đáy.
 */
export function MacroStack({ days }: { readonly days: readonly (MacroStackDay | null)[] }) {
  const totals = days.map((day) => (day ? day.carbs + day.fat + day.protein + day.other : 0))
  const top = Math.max(0, ...totals)
  if (top === 0) return <div className="h-12" aria-hidden="true" />
  const scale = (BOTTOM - 4) / top
  const slot = (WIDTH - 12) / 7
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true" className="h-12 w-full">
      {days.map((day, index) => {
        if (!day) return null
        let filled = 0
        return STACK_SEGMENTS.map(([part, fill]) => {
          const height = day[part] * scale
          filled += height
          return height <= 0 ? null : (
            <rect
              key={`${day.date}-${part}`}
              x={6 + slot * (index + 0.5) - 5}
              y={BOTTOM - filled}
              width="10"
              height={height}
              className={cn(fill, 'motion-safe:animate-chart-rise')}
            />
          )
        })
      })}
    </svg>
  )
}

interface HabitGridProps {
  /** 30 ô theo thứ tự cũ → mới (hàng trước, ô cuối là hôm nay); true = có dữ liệu. */
  readonly cells: readonly boolean[]
  readonly tone: string
}

/** Lưới 3×10 ô nhỏ của "Habits": ô trống rất tối bo nhỏ, ô có dữ liệu màu nhấn, khoảng cách đều. */
export function HabitGrid({ cells, tone }: HabitGridProps) {
  return (
    <div aria-hidden="true" className="grid grid-cols-10 gap-1">
      {cells.map((done, index) => (
        <span
          key={index}
          className={cn(
            'aspect-square rounded-[3px] transition-colors duration-300',
            done ? tone : 'bg-foreground/[0.08]'
          )}
        />
      ))}
    </div>
  )
}
