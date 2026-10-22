'use client'

import Link from 'next/link'
import { ChartColumn, ChevronRight, TrendingUp } from 'lucide-react'
import { ModeToggle } from './DailyNutritionCard'
import type { BalanceMode } from '../../dashboard.utils'
import type { EnergyBalanceSeriesResponse } from '../../types/energy-balance.types'
import { routePath } from '@/config/route-path'
import { UNVERIFIED_TARGET_NOTE, isUnverifiedTarget } from '@/features/nutrition/target-provenance'
import { useUnits } from '@/features/users/hooks/use-units'
import { cn } from '@/lib/utils'

const W = 300
const H = 120

interface EnergyBalanceCardProps {
  /** `GET /energy-balance/series` của 30 ngày gần nhất: từng ngày (cột + đường mốc) và `summary` do BE tính (ba số bên dưới). */
  readonly data: EnergyBalanceSeriesResponse | undefined
  /** TDEE hiện tại: mốc hiển thị khi BE chưa có ngày hợp lệ nào trong khoảng (chế độ Tiêu hao). */
  readonly currentTdee: number | null
  /** Target kcal hôm nay: mốc hiển thị khi BE chưa có ngày hợp lệ nào trong khoảng (chế độ Target). */
  readonly currentTarget: number | null
  readonly mode: BalanceMode
  readonly onModeChange: (mode: BalanceMode) => void
}

/**
 * "Cân bằng năng lượng" 30 ngày: cột xanh là kcal đã ăn (chỉ ngày BE có số), đường nét đứt là target hoặc tiêu hao của TỪNG ngày; bên dưới
 * là Dinh dưỡng − Target/Tiêu hao = Chênh lệch, cả ba là trung bình của BE (`summary`: ngày nào hợp lệ do BE quyết định; FE không tính lại).
 */
export function EnergyBalanceCard({
  data,
  currentTdee,
  currentTarget,
  mode,
  onModeChange,
}: EnergyBalanceCardProps) {
  const days = data?.days ?? []
  const summary = data?.summary
  const targets = mode === 'targets'
  // Ba số theo kcal / kJ của user (BE luôn kcal); cột và đường vẽ vẫn theo kcal vì chỉ là hình
  const { energy } = useUnits()
  const show = (value: number | null) => (value === null ? 'N/A' : energy.format(value))
  // Số "Dinh dưỡng" của TỪNG tab do BE tính trên đúng tập ngày của mốc và chênh lệch (nutrition − baseline = difference); không dùng avgCaloriesKcal (mọi ngày hợp lệ)
  const nutrition =
    (targets ? summary?.avgCaloriesVsTargetKcal : summary?.avgCaloriesVsExpenditureKcal) ?? null
  const baseline =
    (targets ? summary?.avgTargetKcal : summary?.avgExpenditureKcal) ??
    // BE chưa có ngày hợp lệ nào: vẫn hiện mốc hiện tại để thấy chỗ so sánh (như MacroFactor)
    (nutrition === null ? (targets ? currentTarget : currentTdee) : null)
  const difference = (targets ? summary?.avgVsTargetKcal : summary?.avgVsExpenditureKcal) ?? null
  // Ngày có target LEGACY_UNVERIFIED (cờ của BE) chỉ để tham khảo: không vẽ mốc target của ngày đó
  const baselineOf = (day: (typeof days)[number]) =>
    targets
      ? isUnverifiedTarget(day.targetProvenance)
        ? null
        : day.targetKcal
      : day.expenditureKcal
  const unverifiedTargets =
    targets &&
    (days.some((day) => isUnverifiedTarget(day.targetProvenance)) ||
      (summary?.unverifiedTargetDays ?? 0) > 0)
  const drawn = days.flatMap((day, index) => {
    const value = baselineOf(day)
    return value === null ? [] : [{ index, value }]
  })
  // Chưa có mốc nào theo ngày: kẻ một đường nét đứt phẳng ở mốc hiện tại cho cả 30 ngày
  const flat = drawn.length === 0 ? baseline : null
  const top =
    Math.max(
      1,
      flat ?? 0,
      ...days.map((day) => Math.max(day.caloriesKcal ?? 0, baselineOf(day) ?? 0))
    ) * 1.1
  const x = (index: number) => 6 + (index / Math.max(1, days.length - 1)) * (W - 12)
  const y = (value: number) => H - 6 - (value / top) * (H - 16)
  const line = (
    flat !== null
      ? [0, 1].map((edge) => `${6 + edge * (W - 12)},${y(flat).toFixed(1)}`)
      : drawn.map((point) => `${x(point.index).toFixed(1)},${y(point.value).toFixed(1)}`)
  ).join(' ')
  const barWidth = Math.max(2, (W / Math.max(days.length, 1)) * 0.5)
  const baselineTone = targets ? 'text-mf-tile-fat' : 'text-mf-tile-protein'

  return (
    <div className="flex flex-1 flex-col justify-between gap-3">
      <h2 className="text-lg font-bold">
        <Link
          href={routePath.dashboardEnergyBalance}
          className="focus-visible:ring-ring/50 -my-2 flex min-h-11 items-center gap-1 focus-visible:ring-1 focus-visible:outline-none"
        >
          Energy Balance
          <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
        </Link>
      </h2>
      <div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Chart of calories consumed versus target over the last 30 days"
          className="h-28 w-full"
        >
          {days.map((day, index) =>
            day.caloriesKcal === null ? null : (
              <rect
                key={day.date}
                x={x(index) - barWidth / 2}
                y={y(day.caloriesKcal)}
                width={barWidth}
                height={Math.max(1, H - 6 - y(day.caloriesKcal))}
                rx="1.5"
                className={cn('fill-mf-tile-calories', day.isIncomplete && 'opacity-40')}
              />
            )
          )}
          {line && (
            <polyline
              points={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="0.1 5"
              className={baselineTone}
            />
          )}
          <line x1="0" x2={W} y1={H - 3} y2={H - 3} className="stroke-border" strokeWidth="1" />
        </svg>
        <p className="text-muted-foreground pt-1 text-right text-sm">Last 30 Days</p>
      </div>

      <dl className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-x-2 text-center">
        <div>
          <dd className="text-xl tabular-nums">{show(nutrition)}</dd>
          <dt className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
            <ChartColumn aria-hidden="true" className="text-mf-tile-calories size-4" /> Nutrition
          </dt>
        </div>
        <span aria-hidden="true" className="text-xl">
          −
        </span>
        <div>
          <dd className="text-xl tabular-nums">{show(baseline)}</dd>
          <dt className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
            <TrendingUp aria-hidden="true" className={cn('size-4', baselineTone)} />
            {targets ? 'Target' : 'Expenditure'}
          </dt>
        </div>
        <span aria-hidden="true" className="text-xl">
          =
        </span>
        <div>
          <dd className="text-xl tabular-nums">{show(difference)}</dd>
          <dt className="text-muted-foreground text-sm">Difference</dt>
        </div>
      </dl>
      {unverifiedTargets && (
        <p className="text-muted-foreground text-center text-xs">{UNVERIFIED_TARGET_NOTE}</p>
      )}

      <ModeToggle
        value={mode}
        onChange={onModeChange}
        ariaLabel="Compare to"
        options={[
          ['expenditure', 'Expenditure'],
          ['targets', 'Target'],
        ]}
      />
    </div>
  )
}
