import { Pencil } from 'lucide-react'
import { formatWeekdayMonthDay } from '@/lib/week'
import { groupByMonth, type MetricPoint } from '../../body-metric.utils'

interface MetricHistoryListProps {
  readonly points: readonly MetricPoint[]
  readonly unit: string
  /** Biểu tượng nguồn bên trái mỗi dòng (Scale Weight); không có thì bỏ cột. */
  readonly icon?: React.ReactNode
  readonly onEdit: (date: string) => void
}

/** Lịch sử theo tháng (mới trước): giá trị + ngày "Mon, Oct 19", nút bút chì mở bảng sửa. */
export function MetricHistoryList({ points, unit, icon, onEdit }: MetricHistoryListProps) {
  const months = groupByMonth(points)
  if (months.length === 0) return null
  return (
    <div className="space-y-6">
      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="space-y-3">
          <h2 className="text-xl font-bold">{month.label}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {month.items.map((point) => (
              <li key={point.date} className="flex min-h-18 items-center gap-4 px-4 py-2">
                {icon}
                <div className="min-w-0 flex-1">
                  <p className="text-lg tabular-nums">
                    {point.value.toFixed(1)}
                    {unit === '%' ? '%' : ` ${unit}`}
                  </p>
                  <p className="text-muted-foreground text-base">
                    {formatWeekdayMonthDay(point.date)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Edit ${formatWeekdayMonthDay(point.date)}`}
                  onClick={() => onEdit(point.date)}
                  className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
                >
                  <Pencil aria-hidden="true" fill="currentColor" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
