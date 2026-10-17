import { cn } from '@/lib/utils'
import type { TargetKind } from '../../types/dashboard.types'

const WIDTH = 120
const HEIGHT = 44

interface SparklineProps {
  readonly values: readonly number[]
  readonly className?: string
}

/** Đường xu hướng nhỏ (kiểu MacroFactor): các điểm tròn nối nhau, màu theo `currentColor`. */
export function Sparkline({ values, className }: SparklineProps) {
  if (values.length === 0) return <div className="h-12" aria-hidden="true" />
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const points = values.map((value, index) => ({
    x: values.length === 1 ? WIDTH - 10 : 6 + (index / (values.length - 1)) * (WIDTH - 12),
    y: 38 - ((value - min) / span) * 30,
  }))
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      className={cn('h-12 w-full', className)}
    >
      {points.length > 1 && (
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {points.map((point) => (
        <circle
          key={`${point.x}-${point.y}`}
          cx={point.x}
          cy={point.y}
          r="2.6"
          fill="var(--card)"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      ))}
    </svg>
  )
}

interface HabitGridProps {
  /** 30 ô theo thứ tự cũ → mới (hàng trước, ô cuối là hôm nay); true = có dữ liệu. */
  readonly cells: readonly boolean[]
  readonly tone: string
}

/** Lưới 3×10 ô nhỏ của "Habits": ô sáng màu = ngày có thực hiện. */
export function HabitGrid({ cells, tone }: HabitGridProps) {
  return (
    <div aria-hidden="true" className="grid grid-cols-10 gap-[3px]">
      {cells.map((done, index) => (
        <span
          key={index}
          className={cn('aspect-square rounded-[3px]', done ? tone : 'bg-muted-foreground/20')}
        />
      ))}
    </div>
  )
}

interface TargetBarProps {
  readonly value: number
  readonly target: number | null
  readonly kind: TargetKind
  readonly tone: string
}

const TICK_AT = 85

/**
 * Thanh có vạch target: `target` tô phần đã đạt tới vạch; `floor` tô vùng cần đạt (từ gần vạch tới cuối);
 * `ceiling` tô cả thanh, vạch ở đầu (vượt vạch là quá giới hạn). `none` không vẽ.
 */
export function TargetBar({ value, target, kind, tone }: TargetBarProps) {
  if (kind === 'none') return <div className="h-5" aria-hidden="true" />
  const ratio = target && target > 0 ? Math.min(1, value / target) : 0
  return (
    <div
      aria-hidden="true"
      className="bg-muted-foreground/20 relative h-5 overflow-hidden rounded-sm"
    >
      {kind === 'target' && (
        <span
          className={cn(
            'absolute inset-y-0 left-0 rounded-sm transition-[width] duration-500',
            tone
          )}
          style={{ width: `${ratio * TICK_AT}%` }}
        />
      )}
      {kind === 'floor' && (
        <span
          className={cn('absolute inset-y-0 right-0 opacity-45', tone)}
          style={{ left: '70%' }}
        />
      )}
      {kind === 'ceiling' && <span className={cn('absolute inset-0 opacity-45', tone)} />}
      <span
        className="bg-foreground/60 absolute inset-y-1 w-0.5 rounded-full"
        style={{ left: kind === 'ceiling' ? '3%' : `${TICK_AT}%` }}
      />
    </div>
  )
}

/** Đường kẻ đứt đoạn (Energy Balance tuần qua). */
export function DashedLine({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 120 12" aria-hidden="true" className={cn('h-5 w-full', className)}>
      <line
        x1="2"
        y1="6"
        x2="118"
        y2="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 4"
      />
    </svg>
  )
}

/** Thanh ngang dày kèm vạch tiến độ nhỏ ở đầu (Goal Progress). */
export function GoalBar({ percent }: { readonly percent: number }) {
  return (
    <div aria-hidden="true" className="bg-muted-foreground/20 relative h-10 rounded-sm">
      <span
        className="bg-mf-tile-carbs absolute inset-y-0 left-0 rounded-sm"
        style={{ width: `${Math.max(1, Math.min(100, percent))}%` }}
      />
    </div>
  )
}
