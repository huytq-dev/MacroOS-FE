import { Scale, Triangle } from 'lucide-react'
import { DETAIL_CARD } from '../DetailPage'
import type { BalanceMode } from '../../dashboard.utils'
import type { BalanceTrend } from '../../energy-balance.utils'
import { cn } from '@/lib/utils'

interface BalanceChangeRow {
  readonly days: number
  /** Chênh lệch trung bình kcal/ngày trong N ngày gần nhất (đã ăn − mốc). */
  readonly difference: number
  readonly trend: BalanceTrend
}

interface EnergyBalanceInsightsProps {
  readonly mode: BalanceMode
  readonly changes: readonly BalanceChangeRow[]
}

const LABELS: Record<BalanceMode, Record<BalanceTrend, string>> = {
  expenditure: { above: 'Surplus', below: 'Deficit', even: 'Balance' },
  targets: { above: 'Over Target', below: 'Under Target', even: 'At Target' },
}

/** "Insights & Data" của Energy Balance: các hàng "Relative to Expenditure/Targets" cho 3/7/14/30/90 ngày. */
export function EnergyBalanceInsights({ mode, changes }: EnergyBalanceInsightsProps) {
  const expenditure = mode === 'expenditure'
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Insights & Data</h2>
      <section aria-labelledby="relative-heading" className={`${DETAIL_CARD} p-4`}>
        <h3 id="relative-heading" className="text-lg">
          {expenditure ? 'Relative to Expenditure' : 'Relative to Targets'}
        </h3>
        <ul className="mt-3 space-y-4">
          {changes.map(({ days, difference, trend }) => (
            <li
              key={days}
              className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-base"
            >
              <span className="text-muted-foreground">{days}-day</span>
              <span className="tabular-nums">
                {difference > 0 ? '+' : ''}
                {difference} kcal
              </span>
              <span className="text-muted-foreground flex items-center gap-2">
                {expenditure ? (
                  <Scale aria-hidden="true" className="text-mf-tile-protein size-5" />
                ) : (
                  <Triangle
                    aria-hidden="true"
                    fill="currentColor"
                    className={cn('text-mf-tile-fat size-4', trend === 'below' && 'rotate-180')}
                  />
                )}
                {LABELS[mode][trend]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
