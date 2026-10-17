'use client'

import {
  EnergyBalanceTile,
  ExpenditureTile,
  GoalProgressTile,
  SubPageHeader,
  WeightTrendTile,
} from '../components/DashboardPage'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { useCurrentProgram } from '@/features/program/hooks/use-program'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

// BE: ProgramResponse chưa trả cân mục tiêu; có rồi thì lấy từ program để Tiến độ mục tiêu tính thật.
const GOAL_TARGET_KG = null

/** "Phân tích" (Xem tất cả): Tiêu hao, Xu hướng cân, Cân bằng năng lượng, Tiến độ mục tiêu. */
export function InsightsPage() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const program = useCurrentProgram()
  const data = useDashboardData(today, Boolean(program.data), GOAL_TARGET_KG)

  return (
    <div className="flex max-w-2xl flex-col gap-6 pb-16 md:pb-0">
      <SubPageHeader title="Insights & Analytics" />
      <section aria-labelledby="all-heading" className="space-y-3">
        <h2 id="all-heading" className="text-xl font-bold">
          All
        </h2>
        {!today || program.isLoading || data.isLoading ? (
          <div className="grid grid-cols-2 gap-3" aria-busy="true">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <ExpenditureTile data={data} />
            <WeightTrendTile data={data} />
            <EnergyBalanceTile data={data} />
            <GoalProgressTile data={data} />
          </div>
        )}
      </section>
    </div>
  )
}
