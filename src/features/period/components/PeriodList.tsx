import { Pencil } from 'lucide-react'
import { periodDetail, periodRangeLabel } from '../period.utils'
import type { PeriodEntry } from '../types/period.types'
import { groupByMonth } from '@/features/weight/body-metric.utils'

interface PeriodListProps {
  readonly entries: readonly PeriodEntry[]
  readonly onEdit: (id: string) => void
}

/** Danh sách kỳ theo tháng bắt đầu (mới trước): "Oct 12 – Oct 16", "5 days · Cycle 28 days", triệu chứng nếu có, bút chì mở bảng sửa. */
export function PeriodList({ entries, onEdit }: PeriodListProps) {
  const months = groupByMonth(entries.map((entry) => ({ ...entry, date: entry.startDate })))
  if (months.length === 0) return null
  return (
    <div className="space-y-6">
      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="space-y-3">
          <h2 className="text-xl font-bold">{month.label}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {month.items.map((entry, index) => (
              <li
                key={entry.id}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 flex min-h-18 items-center gap-4 px-4 py-2 [animation-fill-mode:backwards]"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-lg tabular-nums">{periodRangeLabel(entry)}</p>
                  <p className="text-muted-foreground text-base">{periodDetail(entry)}</p>
                  {entry.symptoms && (
                    <p className="text-muted-foreground truncate text-base">{entry.symptoms}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Edit period starting ${periodRangeLabel(entry)}`}
                  onClick={() => onEdit(entry.id)}
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
