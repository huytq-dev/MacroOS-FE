import { MoveIndicator } from './MoveIndicator'
import { shortDay } from '../../expenditure.utils'
import type { WeightMove, WeightPoint } from '../../weight-trend.utils'

interface WeightMonthlyListProps {
  readonly months: readonly {
    key: string
    label: string
    items: readonly { point: WeightPoint; move: WeightMove }[]
  }[]
}

/** Danh sách theo tháng ở cuối trang: mỗi ngày một dòng (xu hướng kg, ngày, biến động so với lần cân trước). */
export function WeightMonthlyList({ months }: WeightMonthlyListProps) {
  if (months.length === 0) return null
  return (
    <div className="space-y-6">
      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="space-y-3">
          <h2 className="text-lg font-bold">{month.label}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {month.items.map(({ point, move }) => (
              <li
                key={point.date}
                className="flex min-h-16 items-center justify-between gap-3 px-4 py-2"
              >
                <div>
                  <p className="text-lg tabular-nums">{point.trend.toFixed(1)} kg</p>
                  <p className="text-muted-foreground text-base">{shortDay(point.date)}</p>
                </div>
                <MoveIndicator move={move} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
