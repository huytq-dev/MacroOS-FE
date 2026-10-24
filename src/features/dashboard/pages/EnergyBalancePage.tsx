'use client'

import { useState } from 'react'
import { ChartColumn } from 'lucide-react'
import { SubPageHeader } from '../components/DashboardPage'
import { RangeBar, StatBlock } from '../components/DetailPage'
import {
  BalanceHistory,
  EnergyBalanceChart,
  EnergyBalanceInsights,
  ModeTabs,
} from '../components/EnergyBalancePage'
import { slotsOf, viewWindow } from '../chart/geometry'
import { useChartPan } from '../chart/use-chart-pan'
import {
  ExpandableChart,
  ExpandButton,
  ExpandFooter,
  useChartExpand,
} from '../chart/use-chart-expand'
import { useTween } from '../chart/use-tween'
import { usePersistedChoice } from '../hooks/use-dashboard'
import { useEnergyBalanceDetail } from '../hooks/use-energy-balance-detail'
import type { BalanceMode } from '../dashboard.utils'
import { summarizeBalance } from '../energy-balance.utils'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { rangeLabel, type Averaging, type RangeKey } from '../expenditure.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { UNVERIFIED_TARGET_NOTE } from '@/features/nutrition/target-provenance'
import { useUnits } from '@/features/users/hooks/use-units'
import { cn } from '@/lib/utils'

const BALANCE_MODES = ['expenditure', 'targets'] as const

/**
 * Chi tiết "Energy Balance" (bấm thẻ/ô Energy Balance ở Dashboard): tab Expenditure / Calorie Targets, số lớn của khoảng đang xem,
 * cột kcal đã ăn so với đường mốc KÉO NGANG được để xem các ngày trước, chọn kỳ 1W…All (luôn kết thúc hôm nay, đổi kỳ thì biểu đồ
 * giãn / co mượt) và D/W/M, nút phóng to (chiều cao chạy mượt), chú giải, các hàng "Relative to …" và lịch sử từng ngày theo tháng.
 */
export function EnergyBalancePage() {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const expand = useChartExpand()
  // Cùng key với thẻ Energy Balance ở Dashboard nên hai nơi luôn đồng bộ.
  const [mode, setMode] = usePersistedChoice<BalanceMode>(
    'dashboard.balanceMode',
    'expenditure',
    BALANCE_MODES
  )
  const data = useEnergyBalanceDetail(averaging, mode)
  const derived = useDerivedGate()
  const total = data.ready ? data.all.length : 0
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })
  const { energy } = useUnits()

  if (data.isError)
    return (
      <ErrorState
        error={new Error('Could not load Energy Balance')}
        onRetry={data.refetch}
        isRetrying={data.isFetching}
      />
    )

  const targets = mode === 'targets'
  const win = data.ready ? viewWindow(data.today, target, pan.view.snapped) : null
  const summary = summarizeBalance(
    data.ready && win ? data.all.filter((day) => day.date >= win.from && day.date <= win.to) : [],
    mode
  )

  return (
    <div
      aria-busy={derived.gate === 'updating'}
      className={cn(
        'flex w-full max-w-2xl min-w-0 flex-col gap-5 transition-opacity md:pb-0',
        // BE đang dựng lại: giữ nguyên biểu đồ và số cũ (làm mờ, không thay bằng khung xám làm trang co lại); số mới tự thay khi xong
        derived.gate === 'updating' && 'opacity-60'
      )}
    >
      <SubPageHeader title="Energy Balance" />
      <ModeTabs value={mode} onChange={setMode} />

      {derived.gate === 'failed' ? (
        <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
      ) : !data.ready || data.isLoading || !win ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <StatBlock
              label={summary.label}
              value={summary.value === null ? null : energy.format(summary.value)}
              unit={energy.unit}
            />
            <ExpandButton expand={expand} />
          </div>
          <p className="text-muted-foreground -mt-3 text-lg">{rangeLabel(win.from, win.to)}</p>
          {data.targetUnverified && (
            <p className="text-muted-foreground -mt-2 text-sm">{UNVERIFIED_TARGET_NOTE}</p>
          )}

          <ExpandableChart expand={expand}>
            <EnergyBalanceChart
              // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
              key={averaging}
              className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
              // Biểu đồ vẽ theo kcal / kJ của user để vạch trục và chú thích đúng đơn vị đó
              points={data.points.map((point) => ({
                ...point,
                consumed: point.consumed === null ? null : energy.convert(point.consumed),
                baseline: point.baseline === null ? null : energy.convert(point.baseline),
              }))}
              unit={energy.unit}
              today={data.today}
              mode={mode}
              slots={slots}
              pos={pan.view.pos}
              height={expand.height}
              pan={pan}
            />
          </ExpandableChart>
          <ExpandFooter expand={expand}>
            <RangeBar
              range={range}
              onRangeChange={setRange}
              averaging={averaging}
              onAveragingChange={setAveraging}
            />
          </ExpandFooter>

          <div className="bg-card text-foreground flex items-center justify-center gap-6 rounded-xl px-4 py-4 text-base">
            <span className="flex items-center gap-2">
              <ChartColumn
                aria-hidden="true"
                strokeWidth={3}
                className="text-mf-tile-calories size-5"
              />
              Calories
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="flex items-center gap-0.5">
                {[0, 1, 2].map((dash) => (
                  <span
                    key={dash}
                    className={cn(
                      'h-0.5 w-1.5 rounded-full',
                      targets ? 'bg-mf-tile-fat' : 'bg-mf-tile-protein'
                    )}
                  />
                ))}
              </span>
              {targets ? 'Targets' : 'Expenditure'}
            </span>
          </div>
          <EnergyBalanceInsights mode={mode} changes={data.changes} />
          <BalanceHistory mode={mode} history={data.history} />
        </>
      )}
    </div>
  )
}
