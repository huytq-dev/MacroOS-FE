import { DETAIL_CARD, MetricRow } from '../DetailPage'
import type { EtaView, GoalTab } from '../../goal-progress.utils'
import { useUnits } from '@/features/users/hooks/use-units'
import { formatMonthDay } from '@/lib/date'
import { roundTo } from '@/lib/units'

interface GoalInsightsProps {
  readonly tab: GoalTab
  readonly targetKg: number
  readonly durationDays: number
  /** ETA do BE quyết (`GET /goals/progress`): ngày, đã đạt, hoặc không có kèm lý do. */
  readonly eta: EtaView
}

/** "Insights & Data" của Goal Progress: cân mục tiêu, thời lượng theo đuổi goal và ETA của BE. */
export function GoalInsights({ targetKg, durationDays, eta }: GoalInsightsProps) {
  const { weight } = useUnits()
  const date = eta.kind === 'date' ? eta.date : null
  const etaText =
    eta.kind === 'unavailable'
      ? eta.reason
      : eta.kind === 'achieved'
        ? 'You have reached your goal weight.'
        : 'Estimate of when you would reach your goal, extrapolated from your recent rate of weight change.'
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Insights & Data</h2>
      <section className={`${DETAIL_CARD} space-y-5 p-4`}>
        <MetricRow
          value={String(roundTo(weight.convert(targetKg), 1))}
          unit={weight.unit}
          title="Target Weight"
          text="The target you selected during goal creation."
        />
        <MetricRow
          value={String(durationDays)}
          unit="days"
          title="Duration"
          text="The number of days that you have spent pursuing your current goal."
        />
        <MetricRow
          value={eta.kind === 'achieved' ? 'Goal reached' : date ? formatMonthDay(date) : '---'}
          unit={date ? date.slice(0, 4) : ''}
          title="ETA"
          text={etaText}
        />
      </section>
    </div>
  )
}
