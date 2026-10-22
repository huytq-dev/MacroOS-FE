'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useUnits } from '@/features/users/hooks/use-units'
import { MONTH_NAMES, formatDate } from '@/lib/date'
import { yearHeatmap } from '../../habits.utils'

/** Ô 10px + khoảng cách 3px: một cột tuần rộng 13px. */
const COLUMN_PX = 13

interface HabitHeatmapProps {
  readonly year: number
  readonly tracked: ReadonlySet<string>
  readonly today: string
}

/**
 * Heatmap cả năm như MacroFactor: mỗi cột là một tuần (từ ngày đầu tuần của user), ô nhỏ bo nhẹ, ô trống rất tối, ô đã thực hiện màu xanh, ngày
 * chưa tới còn tối hơn. Nhãn tháng nằm dưới cột tuần chứa mùng 1; quá rộng so với màn hình thì cuộn ngang và tự cuộn tới tháng hiện
 * tại (năm đang xem là năm nay). Cả khối hiện dần khi đổi năm.
 */
export function HabitHeatmap({ year, tracked, today }: HabitHeatmapProps) {
  const { weekStartDay } = useUnits()
  const { weeks, monthLabels } = yearHeatmap(year, weekStartDay)
  const scroller = useRef<HTMLDivElement>(null)
  const currentColumn = monthLabels[Number(today.slice(5, 7)) - 1]?.column ?? 0
  const isThisYear = String(year) === today.slice(0, 4)

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    element.scrollLeft = isThisYear ? Math.max(0, currentColumn * COLUMN_PX - 24) : 0
  }, [isThisYear, currentColumn, year])

  return (
    <section aria-labelledby="habit-year" className="min-w-0 space-y-3">
      <h2 id="habit-year" className="text-xl font-bold">
        {year}
      </h2>
      <div className="bg-card rounded-xl p-3">
        <div
          ref={scroller}
          key={year}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-500 w-0 min-w-full [scrollbar-width:none] overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
        >
          <div className="relative" style={{ width: weeks.length * COLUMN_PX - 3 }}>
            <div
              role="img"
              aria-label={`${year} activity`}
              className="grid auto-cols-[10px] grid-flow-col grid-rows-[repeat(7,10px)] gap-[3px]"
            >
              {weeks.flatMap((week, column) =>
                week.days.map((iso, row) =>
                  iso === null ? (
                    <span key={`${column}-${row}`} />
                  ) : (
                    <span
                      key={iso}
                      title={formatDate(iso)}
                      className={cn(
                        'rounded-[2px]',
                        tracked.has(iso)
                          ? 'bg-mf-tile-carbs'
                          : iso > today
                            ? 'bg-foreground/[0.04]'
                            : 'bg-foreground/[0.08]'
                      )}
                    />
                  )
                )
              )}
            </div>
            <div aria-hidden="true" className="text-muted-foreground relative mt-1.5 h-4 text-xs">
              {monthLabels.map(({ month, column }) => (
                <span
                  key={month}
                  className="absolute top-0 whitespace-nowrap"
                  style={{ left: column * COLUMN_PX }}
                >
                  {MONTH_NAMES[month].slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
