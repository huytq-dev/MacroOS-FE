import { Triangle } from 'lucide-react'
import { DETAIL_CARD } from '../DetailPage'
import type { BalanceMode } from '../../dashboard.utils'
import type { BalanceTrend } from '../../energy-balance.utils'
import { cn } from '@/lib/utils'

interface BalanceChangeRow {
  readonly days: number
  /** Chênh lệch trung bình kcal/ngày (đã ăn − mốc) trong N ngày kết thúc hôm nay; null = chưa có ngày nào dùng được. */
  readonly difference: number | null
  /** null = Waiting. */
  readonly trend: BalanceTrend | null
}

interface EnergyBalanceInsightsProps {
  readonly mode: BalanceMode
  readonly changes: readonly BalanceChangeRow[]
}

const LABELS: Record<BalanceMode, Record<BalanceTrend, string>> = {
  expenditure: { above: 'Surplus', below: 'Deficit', even: 'Balance' },
  targets: { above: 'Above Target', below: 'Below Target', even: 'At Target' },
}

/** "+832 kcal" / "−2,332 kcal" (dấu trừ thật, luôn có dấu khi khác 0). */
export const signedKcal = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('en-US')} kcal`

/** ▼ / ▲ + nhãn của một mức chênh lệch: cam ở tab Expenditure, vàng ở tab Calorie Targets; cân bằng thì không có mũi tên. */
export function BalanceTag({
  mode,
  trend,
}: {
  readonly mode: BalanceMode
  readonly trend: BalanceTrend | null
}) {
  const color = mode === 'targets' ? 'text-mf-tile-fat' : 'text-mf-tile-protein'
  return (
    <span className="text-muted-foreground flex items-center gap-2 whitespace-nowrap">
      {trend === 'above' || trend === 'below' ? (
        <Triangle
          aria-hidden="true"
          fill="currentColor"
          className={cn(color, 'size-4', trend === 'below' && 'rotate-180')}
        />
      ) : (
        <span aria-hidden="true" className={cn(color, 'w-4 text-center font-bold')}>
          =
        </span>
      )}
      {trend === null ? 'Waiting' : LABELS[mode][trend]}
    </span>
  )
}

/** "Insights & Data" của Energy Balance: các hàng "Relative to Expenditure/Targets" cho 3/7/14/30/90 ngày. */
export function EnergyBalanceInsights({ mode, changes }: EnergyBalanceInsightsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Insights & Data</h2>
      <section aria-labelledby="relative-heading" className={`${DETAIL_CARD} p-4`}>
        <h3 id="relative-heading" className="text-lg">
          {mode === 'expenditure' ? 'Relative to Expenditure' : 'Relative to Targets'}
        </h3>
        <ul className="mt-3 space-y-4">
          {changes.map(({ days, difference, trend }) => (
            <li
              key={days}
              className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-base"
            >
              <span className="text-muted-foreground">{days}-day</span>
              <span className="tabular-nums">
                {difference === null ? '--' : signedKcal(difference)}
              </span>
              <BalanceTag mode={mode} trend={trend} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
