import type { NutrientInfo } from '../nutrient-detail.utils'
import type { NutrientSeriesDay } from '../types/nutrient-detail.types'
import { NutrientGoalBar } from '@/features/nutrition/NutrientGoalBar'
import { goalPercent, hasGoal, primaryGoal } from '@/features/nutrition/goal-progress'
import { formatAmount } from '@/features/nutrition/nutrient-display'
import { entryDayLabel, groupByMonth } from '@/features/weight/body-metric.utils'

interface NutrientHistoryProps {
  readonly info: NutrientInfo
  /** Từng ngày (cũ → mới); chỉ ngày đã log được liệt kê. */
  readonly days: readonly NutrientSeriesDay[]
}

/**
 * Lịch sử theo tháng (mới trước), bỏ ngày chưa log: "Wed, Oct 21", "3258 / 2880 kcal", "113%" và thanh có vạch target của ngày đó;
 * chất không có mục tiêu hiện lượng và "No Target". Tháng và dòng hiện lần lượt.
 */
export function NutrientHistory({ info, days }: NutrientHistoryProps) {
  const { nutrient, tone } = info
  const months = groupByMonth(days.filter((day) => day.amount !== null))
  if (months.length === 0) return null
  return (
    <div className="space-y-6">
      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="space-y-3">
          <h2 className="text-xl font-bold">{month.label}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {month.items.map((day, index) => {
              const amount = day.amount ?? 0
              const target = primaryGoal(day)
              const percent = goalPercent(day, amount)
              return (
                <li
                  key={day.date}
                  className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 px-4 py-4 [animation-fill-mode:backwards]"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-base">
                    <span className="whitespace-nowrap">{entryDayLabel(day.date)}</span>
                    <span className="text-center tabular-nums">
                      {target !== null
                        ? `${formatAmount(amount, nutrient.unit)} / ${formatAmount(target, nutrient.unit)} ${nutrient.unit}`
                        : `${formatAmount(amount, nutrient.unit)} ${nutrient.unit}`}
                    </span>
                    <span className="text-muted-foreground text-right tabular-nums">
                      {percent !== null ? `${percent}%` : 'No Target'}
                    </span>
                  </div>
                  {hasGoal(day) && (
                    <div className="mt-3">
                      <NutrientGoalBar goal={day} consumed={amount} tone={tone} layout="row" />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
