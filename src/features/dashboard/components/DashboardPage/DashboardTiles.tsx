import Link from 'next/link'
import { ChevronRight, Database } from 'lucide-react'
import { MetricTile } from './MetricTile'
import { GoalBar, MiniBalance, MiniFlux, Sparkline } from './TileVisuals'
import { energyBalance, type BalanceMode } from '../../dashboard.utils'
import { toBalancePoints } from '../../energy-balance.utils'
import { usePersistedChoice } from '../../hooks/use-dashboard'
import type { DashboardData } from '../../hooks/use-dashboard-data'
import { routePath } from '@/config/route-path'

export type Data = { readonly data: DashboardData }

export const fixed = (value: number | null, digits = 1) =>
  value === null ? '---' : value.toFixed(digits)

export function ExpenditureTile({ data }: Data) {
  return (
    <MetricTile
      title="Expenditure"
      subtitle="Last 7 Days"
      href={routePath.dashboardExpenditure}
      visual={<MiniFlux values={data.tdeeSpark} className="text-mf-tile-protein" />}
      value={data.tdee === null ? '---' : String(Math.round(data.tdee))}
      unit="kcal"
    />
  )
}

export function WeightTrendTile({ data }: Data) {
  return (
    <MetricTile
      title="Weight Trend"
      subtitle="Last 7 Days"
      href={routePath.dashboardWeightTrend}
      visual={
        <Sparkline values={data.weightSpark} raw={data.weightRaw} className="text-mf-purple" />
      }
      value={fixed(data.weightLatest)}
      unit="kg"
    />
  )
}

const BALANCE_MODES = ['expenditure', 'targets'] as const

export function EnergyBalanceTile({ data }: Data) {
  // Cùng key với trang Energy Balance và thẻ carousel nên ba nơi luôn đồng bộ
  const [mode] = usePersistedChoice<BalanceMode>(
    'dashboard.balanceMode',
    'expenditure',
    BALANCE_MODES
  )
  const { difference } = energyBalance(
    data.daily.slice(-7),
    mode,
    data.tdee,
    data.todayTarget?.caloriesTarget ?? null
  )
  return (
    <MetricTile
      title="Energy Balance"
      subtitle="Last 7 Days"
      href={routePath.dashboardEnergyBalance}
      visual={
        <MiniBalance
          points={toBalancePoints(data.daily.slice(-7), mode, data.tdee)}
          className={mode === 'targets' ? 'text-mf-tile-fat' : 'text-mf-tile-protein'}
        />
      }
      value={difference === null ? '---' : String(Math.abs(difference))}
      unit={difference !== null && difference < 0 ? 'kcal deficit' : 'kcal surplus'}
    />
  )
}

export function GoalProgressTile({ data }: Data) {
  return (
    <MetricTile
      title="Goal Progress"
      subtitle={
        data.goalDays === null
          ? 'Since Start'
          : `Last ${data.goalDays} ${data.goalDays === 1 ? 'Day' : 'Days'}`
      }
      href={routePath.dashboardGoalProgress}
      visual={data.goalPercent === null ? undefined : <GoalBar percent={data.goalPercent} />}
      value={data.goalPercent === null ? '---' : String(data.goalPercent)}
      unit="%"
    />
  )
}

export function MoreSection() {
  return (
    <section aria-labelledby="more-heading" className="space-y-3">
      <h2 id="more-heading" className="text-xl font-bold">
        Other
      </h2>
      <Link
        href={routePath.nutritionData}
        className="bg-card active:bg-muted focus-visible:ring-ring/50 flex min-h-16 items-center gap-4 rounded-2xl px-5 py-4 transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        <Database aria-hidden="true" className="size-6 shrink-0" />
        <span className="flex-1 text-lg">Nutrition Data Manager</span>
        <ChevronRight aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
      </Link>
    </section>
  )
}
