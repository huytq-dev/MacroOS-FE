import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { formatMonthYear } from '@/lib/date'
import { formatWeekdayMonthDay } from '@/lib/week'
import type { ExpHistoryDay } from '../../expenditure-series'
import { useUnits } from '@/features/users/hooks/use-units'

interface MonthlyListProps {
  /** Mỗi ngày một dòng, mới trước. */
  readonly history: readonly ExpHistoryDay[]
}

/** "−3 kcal" / "+5 kJ" của ngày Updating so với hôm trước (đã đổi sang đơn vị của user); không đổi thì "No Change". */
const deltaText = (delta: number | null, unit: string) =>
  delta === null || delta === 0
    ? delta === 0
      ? 'No Change'
      : 'Updating'
    : `${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${unit}`

/** Xu hướng lên / xuống (cam) hoặc mũi tên ngang khi không đổi. */
function DeltaIcon({ delta }: { readonly delta: number | null }) {
  const Icon = delta === null || delta === 0 ? ArrowRight : delta > 0 ? TrendingUp : TrendingDown
  return (
    <Icon aria-hidden="true" className="text-mf-tile-protein size-5 shrink-0" strokeWidth={2.5} />
  )
}

/**
 * Lịch sử ở cuối trang theo tháng (như MacroFactor): mỗi ngày một dòng với kcal và ngày bên trái; bên phải "□ Holding" cho ngày
 * Holding hoặc "○ −3 kcal" (thay đổi so với hôm trước) cho ngày Updating. Tháng và dòng hiện lần lượt.
 */
export function MonthlyList({ history }: MonthlyListProps) {
  const { energy } = useUnits()
  if (history.length === 0) return null
  const months = new Map<string, ExpHistoryDay[]>()
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
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 flex min-h-16 items-center justify-between gap-3 px-4 py-2 [animation-fill-mode:backwards]"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <div>
                  <p className="text-lg tabular-nums">{energy.text(day.kcal)}</p>
                  <p className="text-muted-foreground text-base">
                    {formatWeekdayMonthDay(day.date)}
                  </p>
                </div>
                <span className="text-muted-foreground flex items-center gap-2 text-base whitespace-nowrap tabular-nums">
                  {day.holding ? (
                    <span
                      aria-hidden="true"
                      className="border-mf-tile-protein/70 size-3 border-2"
                    />
                  ) : (
                    <DeltaIcon delta={day.delta} />
                  )}
                  {day.holding
                    ? day.status
                    : deltaText(
                        day.delta === null ? null : Math.round(energy.convert(day.delta)),
                        energy.unit
                      )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
