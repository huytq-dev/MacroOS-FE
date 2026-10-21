import { MoveIndicator } from './MoveIndicator'
import { shortDay } from '../../expenditure.utils'
import { monthTitle } from '../../hooks/use-weight-trend-detail'
import type { HistoryDay } from '../../weight-trend-series'

interface WeightMonthlyListProps {
  /** Mỗi ngày một dòng, mới trước. */
  readonly history: readonly HistoryDay[]
}

/** "−0.1 kg" / "+0.2 kg"; không đổi thì để chữ "No Change". */
const deltaText = (day: HistoryDay) =>
  day.move === 'same' || day.delta === null
    ? undefined
    : `${day.delta < 0 ? '−' : '+'}${Math.abs(day.delta).toFixed(1)} kg`

/**
 * Lịch sử ở cuối trang theo tháng (như MacroFactor): mỗi ngày một dòng với xu hướng kg và ngày bên trái, bên phải ↘ −0.1 kg /
 * → No Change so với hôm trước. Từng tháng và từng dòng hiện lần lượt.
 */
export function WeightMonthlyList({ history }: WeightMonthlyListProps) {
  if (history.length === 0) return null
  const months = new Map<string, HistoryDay[]>()
  for (const day of history) {
    const key = day.date.slice(0, 7)
    months.set(key, [...(months.get(key) ?? []), day])
  }
  return (
    <div className="space-y-6">
      {[...months.entries()].map(([key, items]) => (
        <section key={key} aria-label={monthTitle(key)} className="space-y-3">
          <h2 className="text-xl font-bold">{monthTitle(key)}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {items.map((day, index) => (
              <li
                key={day.date}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 flex min-h-16 items-center justify-between gap-3 px-4 py-2 [animation-fill-mode:backwards]"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div>
                  <p className="text-lg tabular-nums">{day.trend.toFixed(1)} kg</p>
                  <p className="text-muted-foreground text-base">{shortDay(day.date)}</p>
                </div>
                <MoveIndicator move={day.move} text={deltaText(day)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
