import { shortDay, type ChartPoint } from '../../expenditure.utils'

interface MonthlyListProps {
  readonly months: readonly { key: string; label: string; items: readonly ChartPoint[] }[]
}

/** Danh sách theo tháng ở cuối trang: mỗi ngày một dòng (kcal, ngày, trạng thái Holding/Updating); tháng mới trước. */
export function MonthlyList({ months }: MonthlyListProps) {
  if (months.length === 0) return null
  return (
    <div className="space-y-6">
      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="space-y-3">
          <h2 className="text-lg font-bold">{month.label}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {month.items.map((point) => (
              <li
                key={point.date}
                className="flex min-h-16 items-center justify-between gap-3 px-4 py-2"
              >
                <div>
                  <p className="text-lg tabular-nums">{Math.round(point.value)} kcal</p>
                  <p className="text-muted-foreground text-base">{shortDay(point.date)}</p>
                </div>
                <span className="text-muted-foreground flex items-center gap-2 text-base">
                  {point.holding ? (
                    <span aria-hidden="true" className="border-mf-tile-protein size-3.5 border-2" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="border-mf-tile-protein size-3.5 rounded-full border-2"
                    />
                  )}
                  {point.holding ? 'Holding' : 'Updating'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
