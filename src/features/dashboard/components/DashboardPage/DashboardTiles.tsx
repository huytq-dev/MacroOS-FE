'use client'

import Link from 'next/link'
import { ChevronRight, Database } from 'lucide-react'
import { MetricTile } from './MetricTile'
import { BalanceMini, ExpenditureMini, GoalMini, INSIGHT_DAYS, TrendMini } from './InsightCharts'
import { lastDays, type BalanceMode } from '../../dashboard.utils'
import { goalDuration } from '../../goal-progress.utils'
import { useGoalProgress, usePersistedChoice } from '../../hooks/use-dashboard'
import { useEnergyBalanceDetail } from '../../hooks/use-energy-balance-detail'
import { useExpenditureDetail } from '../../hooks/use-expenditure-detail'
import { useWeightTrendDetail } from '../../hooks/use-weight-trend-detail'
import { routePath } from '@/config/route-path'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { useUnits } from '@/features/users/hooks/use-units'
import { useIsClient } from '@/hooks/use-is-client'
import { todayIso } from '@/lib/date'

export const fixed = (value: number | null, digits = 1) =>
  value === null ? '---' : value.toFixed(digits)

/** Đang dựng lại số dẫn xuất: giữ số cũ nhưng mờ đi (không phải số cuối), không thay bằng khung xám. */
const dimWhile = (gate: string) =>
  gate === 'updating' ? 'opacity-60 transition-opacity' : undefined

const BALANCE_MODES = ['expenditure', 'targets'] as const

/** Ô Expenditure: cùng `GET /expenditure/series` + insights với trang chi tiết (đường từng ngày, trạng thái từng ngày, số hiện tại). */
export function ExpenditureTile() {
  const exp = useExpenditureDetail('daily')
  const { energy } = useUnits()
  const derived = useDerivedGate()
  if (derived.gate === 'failed')
    return <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
  if (!exp.ready || exp.isLoading)
    return <MetricTile title="Expenditure" subtitle="Last 7 Days" value="" loading />
  // Lần tải lại lỗi: số TanStack còn giữ có thể là số trước khi BE dựng lại → không hiện như số cuối; trang chi tiết có "Try again"
  if (exp.isError)
    return (
      <MetricTile
        title="Expenditure"
        subtitle="Last 7 Days"
        href={routePath.dashboardExpenditure}
        value="---"
      />
    )
  const last = exp.daily[exp.daily.length - 1]
  const current = exp.current ?? last?.kcal ?? null
  return (
    <MetricTile
      title="Expenditure"
      subtitle="Last 7 Days"
      className={dimWhile(derived.gate)}
      busy={derived.gate === 'updating'}
      href={routePath.dashboardExpenditure}
      note={
        exp.holdingNotice
          ? exp.holdingNotice.kind === 'Holding'
            ? `On hold: ${exp.holdingNotice.summary}`
            : exp.holdingNotice.summary
          : undefined
      }
      visual={<ExpenditureMini window={lastDays(exp.today, INSIGHT_DAYS)} days={exp.daily} />}
      value={current === null ? '---' : energy.format(current)}
      unit={energy.unit}
    />
  )
}

/** Ô Weight Trend: cùng `GET /weights/trend` với trang chi tiết (xu hướng từng ngày, số hiện tại làm tròn 1 chữ số). */
export function WeightTrendTile() {
  const trend = useWeightTrendDetail('daily')
  const { weight } = useUnits()
  const derived = useDerivedGate()
  if (derived.gate === 'failed')
    return <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
  if (!trend.ready || trend.isLoading)
    return <MetricTile title="Weight Trend" subtitle="Last 7 Days" value="" loading />
  if (trend.isError)
    return (
      <MetricTile
        title="Weight Trend"
        subtitle="Last 7 Days"
        href={routePath.dashboardWeightTrend}
        value="---"
      />
    )
  const last = trend.daily[trend.daily.length - 1]
  const current = trend.current ?? last?.trend ?? null
  return (
    <MetricTile
      title="Weight Trend"
      subtitle="Last 7 Days"
      className={dimWhile(derived.gate)}
      busy={derived.gate === 'updating'}
      href={routePath.dashboardWeightTrend}
      visual={<TrendMini window={lastDays(trend.today, INSIGHT_DAYS)} days={trend.daily} />}
      value={current === null ? '---' : weight.format(current)}
      unit={weight.unit}
    />
  )
}

/** Ô Energy Balance: cùng `GET /energy-balance/series` + insights với trang chi tiết (số lớn là hàng 7 ngày của BE); tab Expenditure / Targets nhớ chung. */
export function EnergyBalanceTile() {
  // Cùng key với trang Energy Balance và thẻ carousel nên ba nơi luôn đồng bộ
  const [mode] = usePersistedChoice<BalanceMode>(
    'dashboard.balanceMode',
    'expenditure',
    BALANCE_MODES
  )
  const balance = useEnergyBalanceDetail('daily', mode)
  const { energy } = useUnits()
  const derived = useDerivedGate()
  if (derived.gate === 'failed')
    return <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
  if (!balance.ready || balance.isLoading)
    return <MetricTile title="Energy Balance" subtitle="Last 7 Days" value="" loading />
  if (balance.isError)
    return (
      <MetricTile
        title="Energy Balance"
        subtitle="Last 7 Days"
        href={routePath.dashboardEnergyBalance}
        value="---"
      />
    )
  const window = lastDays(balance.today, INSIGHT_DAYS)
  const week = balance.all.filter((point) => window.includes(point.date))
  // Số lớn = hàng 7 ngày của `GET /energy-balance/insights` (BE tính: ngày hợp lệ, trung bình, trạng thái), không tự tính từ các ngày
  const row = balance.changes.find((item) => item.days === INSIGHT_DAYS)
  const value = row?.difference ?? null
  const trend = row?.trend ?? null
  return (
    <MetricTile
      title="Energy Balance"
      subtitle="Last 7 Days"
      className={dimWhile(derived.gate)}
      busy={derived.gate === 'updating'}
      href={routePath.dashboardEnergyBalance}
      visual={
        <BalanceMini
          window={window}
          points={week}
          lineClassName={mode === 'targets' ? 'text-mf-tile-fat' : 'text-mf-tile-protein'}
        />
      }
      value={value === null ? '---' : energy.format(Math.abs(value))}
      unit={
        trend === 'below'
          ? `${energy.unit} deficit`
          : trend === 'above'
            ? `${energy.unit} surplus`
            : `${energy.unit} balance`
      }
    />
  )
}

/** Ô Goal Progress: `GET /goals/progress` như trang chi tiết; đang tải = khung xám, chưa có goal = "---" + thanh trống (không phải 0%). */
export function GoalProgressTile() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const goal = useGoalProgress()
  const derived = useDerivedGate()
  if (derived.gate === 'failed')
    return <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
  if (!today || goal.isLoading)
    return <MetricTile title="Goal Progress" subtitle="Since Start" value="" loading />
  if (goal.isError)
    return (
      <MetricTile
        title="Goal Progress"
        subtitle="Since Start"
        href={routePath.dashboardGoalProgress}
        value="---"
      />
    )
  const data = goal.data
  // % do BE tính (null khi chưa có cân mục tiêu, vd. Maintenance): hiện "---", FE không tự tính thay
  const percent = data?.progressPercent == null ? null : Math.round(data.progressPercent)
  // Cùng một cách đếm ngày với trang Goal Progress ("Duration")
  const days = data ? goalDuration(data.startDate, today) : null
  return (
    <MetricTile
      title="Goal Progress"
      subtitle={days === null ? 'Since Start' : `Last ${days} ${days === 1 ? 'Day' : 'Days'}`}
      className={dimWhile(derived.gate)}
      busy={derived.gate === 'updating'}
      href={routePath.dashboardGoalProgress}
      visual={<GoalMini percent={percent} />}
      value={percent === null ? '---' : String(percent)}
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
