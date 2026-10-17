'use client'

import Link from 'next/link'
import { ChartColumn, ChevronRight, TrendingUp } from 'lucide-react'
import { ModeToggle } from './DailyNutritionCard'
import { energyBalance, isLogged, type BalanceMode } from '../../dashboard.utils'
import type { DailyProgress } from '../../types/dashboard.types'
import { routePath } from '@/config/route-path'
import { cn } from '@/lib/utils'

const W = 300
const H = 120

interface EnergyBalanceCardProps {
  /** 30 ngày tiến độ từng ngày, cũ → mới. */
  readonly points: readonly DailyProgress[]
  /** TDEE hiện tại: dùng cho chế độ Tiêu hao khi từng ngày chưa có TDEE riêng. */
  readonly currentTdee: number | null
  /** Target kcal hôm nay: mốc so sánh khi chưa có ngày nào trong 30 ngày. */
  readonly currentTarget: number | null
  readonly mode: BalanceMode
  readonly onModeChange: (mode: BalanceMode) => void
}

const show = (value: number | null) => (value === null ? 'N/A' : String(value))

/**
 * "Cân bằng năng lượng" 30 ngày: cột xanh là kcal đã ăn (chỉ ngày có log), đường nét đứt là target hoặc tiêu hao;
 * bên dưới là phép tính Dinh dưỡng − Target/Tiêu hao = Chênh lệch trên các ngày có log.
 */
export function EnergyBalanceCard({
  points,
  currentTdee,
  currentTarget,
  mode,
  onModeChange,
}: EnergyBalanceCardProps) {
  const summary = energyBalance(points, mode, currentTdee, currentTarget)
  const baselineOf = (point: DailyProgress) =>
    mode === 'targets' ? point.caloriesTarget : (point.estimatedTdeeKcal ?? currentTdee ?? 0)
  // Chưa có ngày nào: kẻ một đường nét đứt phẳng ở mốc hiện tại cho cả 30 ngày
  const flat = points.length === 0 ? summary.baseline : null
  const top =
    Math.max(
      1,
      flat ?? 0,
      ...points.map((point) => Math.max(point.caloriesConsumed, baselineOf(point)))
    ) * 1.1
  const x = (index: number) => 6 + (index / Math.max(1, points.length - 1)) * (W - 12)
  const y = (value: number) => H - 6 - (value / top) * (H - 16)
  const line = (
    flat !== null
      ? [0, 1].map((edge) => `${6 + edge * (W - 12)},${y(flat).toFixed(1)}`)
      : points.map((point, index) => `${x(index).toFixed(1)},${y(baselineOf(point)).toFixed(1)}`)
  ).join(' ')
  const barWidth = Math.max(2, (W / Math.max(points.length, 1)) * 0.5)
  const baselineTone = mode === 'targets' ? 'text-mf-tile-fat' : 'text-mf-tile-protein'

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
          {points.map((point, index) =>
            isLogged(point) ? (
              <rect
                key={point.snapshotDate}
                x={x(index) - barWidth / 2}
                y={y(point.caloriesConsumed)}
                width={barWidth}
                height={H - 6 - y(point.caloriesConsumed)}
                rx="1.5"
                className="fill-mf-tile-calories"
              />
            ) : null
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
          <dd className="text-xl tabular-nums">{show(summary.nutrition)}</dd>
          <dt className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
            <ChartColumn aria-hidden="true" className="text-mf-tile-calories size-4" /> Nutrition
          </dt>
        </div>
        <span aria-hidden="true" className="text-xl">
          −
        </span>
        <div>
          <dd className="text-xl tabular-nums">{show(summary.baseline)}</dd>
          <dt className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
            <TrendingUp aria-hidden="true" className={cn('size-4', baselineTone)} />
            {mode === 'targets' ? 'Target' : 'Expenditure'}
          </dt>
        </div>
        <span aria-hidden="true" className="text-xl">
          =
        </span>
        <div>
          <dd className="text-xl tabular-nums">{show(summary.difference)}</dd>
          <dt className="text-muted-foreground text-sm">Difference</dt>
        </div>
      </dl>

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
