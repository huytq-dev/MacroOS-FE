import { DETAIL_CARD, MetricRow } from '../DetailPage'
import type { GoalTab } from '../../goal-progress.utils'

interface GoalInsightsProps {
  readonly tab: GoalTab
  readonly targetKg: number
  readonly durationDays: number
  /** Ngày dự kiến (iso) nếu giữ đúng tốc độ mong muốn; null = chưa tính được. */
  readonly eta: string | null
}

const BASIS = { scale: 'scale weight', trend: 'trend weight' } as const

/** "Insights & Data" của Goal Progress: cân mục tiêu, thời lượng theo đuổi goal và ngày dự kiến lạc quan. */
export function GoalInsights({ tab, targetKg, durationDays, eta }: GoalInsightsProps) {
  const date = eta ? new Date(`${eta}T00:00:00`) : null
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Insights & Data</h2>
      <section className={`${DETAIL_CARD} space-y-5 p-4`}>
        <MetricRow
          value={String(Math.round(targetKg * 10) / 10)}
          unit="kg"
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
          value={
            date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'
          }
          unit={date ? String(date.getFullYear()) : ''}
          title="Optimistic ETA"
          text={`Estimate of when you would reach your goal if you achieve and sustain your intended rate of weight change based on ${BASIS[tab]}`}
        />
      </section>
    </div>
  )
}
