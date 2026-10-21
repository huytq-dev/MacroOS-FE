import { Pencil } from 'lucide-react'
import { formatSteps } from '../steps.utils'
import { entryDayLabel, groupByMonth } from '@/features/weight/body-metric.utils'

interface StepsHistoryListProps {
  readonly days: readonly { readonly date: string; readonly steps: number }[]
  readonly onEdit: (date: string) => void
}

/** Lịch sử theo tháng (mới trước): số bước + ngày "Mon, Oct 19", nút bút chì mở bảng sửa; tháng và dòng hiện lần lượt. */
export function StepsHistoryList({ days, onEdit }: StepsHistoryListProps) {
  const months = groupByMonth(days)
  if (months.length === 0) return null
  return (
    <div className="space-y-6">
      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="space-y-3">
          <h2 className="text-xl font-bold">{month.label}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {month.items.map((day, index) => (
              <li
                key={day.date}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 flex min-h-18 items-center gap-4 px-4 py-2 [animation-fill-mode:backwards]"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-lg tabular-nums">{formatSteps(day.steps)} steps</p>
                  <p className="text-muted-foreground text-base">{entryDayLabel(day.date)}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Edit ${entryDayLabel(day.date)}`}
                  onClick={() => onEdit(day.date)}
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
