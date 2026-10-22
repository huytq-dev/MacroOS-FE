import { Pencil } from 'lucide-react'
import { groupByMonth } from '@/features/weight/body-metric.utils'
import { formatWeekdayMonthDay } from '@/lib/week'

interface PeriodHistoryListProps {
  /** Các ngày hành kinh (yyyy-MM-dd), thứ tự bất kỳ. */
  readonly days: readonly string[]
  readonly onEdit: (date: string) => void
}

/**
 * Lịch sử theo tháng (mới trước) như MacroFactor: mỗi ngày đã đánh dấu một dòng — "Period" bên trái, "Wed, Oct 21" bên phải và nút bút chì tròn
 * mở bảng của ngày đó; tháng và dòng hiện lần lượt.
 */
export function PeriodHistoryList({ days, onEdit }: PeriodHistoryListProps) {
  const months = groupByMonth(days.map((date) => ({ date })))
  if (months.length === 0) return null
  return (
    <div className="space-y-6">
      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="space-y-3">
          <h2 className="text-xl font-bold">{month.label}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {month.items.map(({ date }, index) => (
              <li
                key={date}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 flex min-h-16 items-center gap-3 px-4 py-2 text-lg [animation-fill-mode:backwards]"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <span className="flex-1">Period</span>
                <span className="text-muted-foreground text-base tabular-nums">
                  {formatWeekdayMonthDay(date)}
                </span>
                <button
                  type="button"
                  aria-label={`Edit ${formatWeekdayMonthDay(date)}`}
                  onClick={() => onEdit(date)}
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
