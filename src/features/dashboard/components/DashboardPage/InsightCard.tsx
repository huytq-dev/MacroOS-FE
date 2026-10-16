import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SparklineProps {
  readonly values: readonly number[]
  readonly className?: string
}

/** Đường xu hướng nhỏ (kiểu MacroFactor): các điểm tròn nối nhau, màu theo `currentColor`. */
function Sparkline({ values, className }: SparklineProps) {
  if (values.length < 2)
    return <p className="text-muted-foreground flex h-12 items-center text-xs">Chưa đủ dữ liệu</p>
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((value, index) => ({
    x: 6 + (index / (values.length - 1)) * 108,
    y: 38 - ((value - min) / span) * 30,
  }))
  return (
    <svg
      viewBox="0 0 120 44"
      role="img"
      aria-hidden="true"
      className={cn('h-12 w-full', className)}
    >
      <polyline
        points={points.map((point) => `${point.x},${point.y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((point) => (
        <circle
          key={`${point.x}`}
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

interface InsightCardProps {
  readonly title: string
  readonly subtitle: string
  readonly href: string
  readonly values: readonly number[]
  readonly value: string
  readonly unit: string
  /** Lớp màu chữ cho đường xu hướng, vd. `text-mf-calories`. */
  readonly tone: string
}

/** Thẻ "Insights & Analytics": tiêu đề, xu hướng, số hiện tại; chạm cả thẻ để mở trang chi tiết. */
export function InsightCard({
  title,
  subtitle,
  href,
  values,
  value,
  unit,
  tone,
}: InsightCardProps) {
  return (
    <Link
      href={href}
      className="bg-card active:bg-muted focus-visible:ring-ring/50 flex min-w-0 flex-col gap-2 rounded-2xl p-4 transition-colors focus-visible:ring-1 focus-visible:outline-none"
    >
      <div>
        <h3 className="truncate text-lg leading-tight font-semibold md:text-base">{title}</h3>
        <p className="text-muted-foreground truncate text-sm md:text-xs">{subtitle}</p>
      </div>
      <Sparkline values={values} className={tone} />
      <div className="border-border/70 flex items-center justify-between border-t pt-3">
        <p className="text-xl font-semibold tabular-nums">
          {value}
          <span className="text-muted-foreground ml-1 text-sm font-normal">{unit}</span>
        </p>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
      </div>
    </Link>
  )
}
