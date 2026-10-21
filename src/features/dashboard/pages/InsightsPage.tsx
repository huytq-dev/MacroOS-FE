'use client'

import {
  EnergyBalanceTile,
  ExpenditureTile,
  GoalProgressTile,
  SubPageHeader,
  WeightTrendTile,
} from '../components/DashboardPage'

/**
 * "Insights & Analytics" (See All): bốn ô Expenditure, Weight Trend, Energy Balance, Goal Progress. Mỗi ô tự lấy dữ liệu từ cùng
 * endpoint với trang chi tiết của nó và tự hiện khung xám khi đang tải, nên trang không cần chờ dữ liệu chung của Dashboard.
 */
export function InsightsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6 md:pb-0">
      <SubPageHeader title="Insights & Analytics" />
      <section aria-labelledby="all-heading" className="space-y-3">
        <h2 id="all-heading" className="text-xl font-bold">
          All
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <ExpenditureTile />
          <WeightTrendTile />
          <EnergyBalanceTile />
          <GoalProgressTile />
        </div>
      </section>
    </div>
  )
}
