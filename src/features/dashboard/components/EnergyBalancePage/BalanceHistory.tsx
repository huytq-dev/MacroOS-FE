import { BalanceTag, signedEnergy } from './EnergyBalanceInsights'
import { formatMonthYear } from '@/lib/date'
import { formatWeekdayMonthDay } from '@/lib/week'
import { useUnits } from '@/features/users/hooks/use-units'
import type { BalanceHistoryDay } from '../../hooks/use-energy-balance-detail'
import type { BalanceMode } from '../../dashboard.utils'

interface BalanceHistoryProps {
  readonly mode: BalanceMode
  /** Mỗi ngày một dòng, mới trước. */
  readonly history: readonly BalanceHistoryDay[]
}

/**
 * Lịch sử ở cuối trang theo tháng (như MacroFactor): mỗi ngày một dòng "+832 kcal" với ngày bên dưới, bên phải "▲ Surplus"
 * (hoặc "▼ Below Target" ở tab Calorie Targets). Tháng và dòng hiện lần lượt.
 */
export function BalanceHistory({ mode, history }: BalanceHistoryProps) {
  const { energy } = useUnits()
  if (history.length === 0) return null
  const months = new Map<string, BalanceHistoryDay[]>()
  for (const day of history) {
    const key = day.date.slice(0, 7)
    months.set(key, [...(months.get(key) ?? []), day])
  }
  return (
    <div className="space-y-6">
      {[...months.entries()].map(([key, items]) => (
        <section key={key} aria-label={formatMonthYear(key)} className="space-y-3">
          <h2 className="text-xl font-bold">{formatMonthYear(key)}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {items.map((day, index) => (
              <li
                key={day.date}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 flex min-h-16 items-center justify-between gap-3 px-4 py-2 text-base [animation-fill-mode:backwards]"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div>
                  <p className="text-lg tabular-nums">{signedEnergy(day.difference, energy)}</p>
                  <p className="text-muted-foreground">{formatWeekdayMonthDay(day.date)}</p>
                </div>
                <BalanceTag mode={mode} trend={day.trend} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
