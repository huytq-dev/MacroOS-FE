'use client'

import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { SubPageHeader } from '../components/DashboardPage'
import { RangeBar, StatBlock, TutorialCard } from '../components/DetailPage'
import {
  SCALE_COLOR,
  TREND_COLOR,
  WEIGHT_TREND_TUTORIAL,
  WeightMonthlyList,
  WeightTrendChart,
  WeightTrendInsights,
} from '../components/WeightTrendPage'
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
import { useWeightTrendDetail } from '../hooks/use-weight-trend-detail'
import { trendLegend } from '../weight-trend-series'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { rangeLabel, type Averaging, type RangeKey } from '../expenditure.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { useUnits } from '@/features/users/hooks/use-units'
import { roundTo } from '@/lib/units'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/**
 * Chi tiết "Weight Trend" (bấm ô Weight Trend ở Dashboard): Average / Difference của khoảng đang xem, biểu đồ hai đường (Scale Weight
 * tím đậm nối các lần cân, Trend Weight tím nhạt có vòng tròn mỗi ngày) KÉO NGANG được để xem các ngày trước, chọn kỳ 1W…All (luôn
 * kết thúc hôm nay, đổi kỳ thì biểu đồ giãn / co mượt) và D/W/M, nút đổi trục (từ 0 ↔ vừa khít dữ liệu, trục chạy mượt), chú giải,
 * hướng dẫn, Insights & Data, Data Sources và lịch sử theo tháng.
 */
export function WeightTrendPage() {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const expand = useChartExpand()
  const [tutorial, setTutorial] = usePersistedChoice(
    'weight-trend.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const data = useWeightTrendDetail(averaging)
  const derived = useDerivedGate()
  const total = data.ready ? data.daily.length : 0
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })
  const { weight } = useUnits()

  if (data.isError) return <ErrorState error={new Error('Could not load Weight Trend')} />

  const win = data.ready ? viewWindow(data.today, target, pan.view.snapped) : null
  const inView =
    data.ready && win ? data.daily.filter((day) => day.date >= win.from && day.date <= win.to) : []
  const scaleInView =
    data.ready && win
      ? data.scale.filter((day) => day.date >= win.from && day.date <= win.to).length
      : 0
  const legend = trendLegend(scaleInView, inView.length)
  // Số hiển thị: đổi sang kg / lb của user rồi mới làm tròn (BE và các phép tính vẫn theo kg)
  const average = inView.length
    ? roundTo(weight.convert(inView.reduce((sum, day) => sum + day.trend, 0) / inView.length), 1)
    : null
  const difference = inView.length
    ? roundTo(weight.convert(inView[inView.length - 1].trend - inView[0].trend), 1)
    : null
  // Biểu đồ vẽ theo đơn vị của user để các vạch trục (0 / 50 / 100…) và số trong chú thích đúng đơn vị đó
  const trendSeries = data.ready
    ? data.trend.map((day) => ({ ...day, trend: weight.convert(day.trend) }))
    : []
  const scaleSeries = data.ready
    ? data.scale.map((day) => ({ ...day, value: weight.convert(day.value) }))
    : []

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 md:pb-0">
      <SubPageHeader
        title="Weight Trend"
        action={
          <IconButton
            icon={GraduationCap}
            label={tutorial === 'show' ? 'Hide tutorial' : 'Show tutorial'}
            className="size-11"
            onClick={() => setTutorial(tutorial === 'show' ? 'hidden' : 'show')}
          />
        }
      />

      {derived.gate === 'failed' ? (
        <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
      ) : derived.gate === 'updating' || !data.ready || data.isLoading || !win ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div
              role="group"
              aria-label="Average and Difference of Trend Weight"
              title="Average and Difference of Trend Weight over the dates shown"
              className="flex gap-10"
            >
              <StatBlock label="Average" value={average?.toFixed(1) ?? null} unit={weight.unit} />
              <StatBlock
                label="Difference"
                value={difference?.toFixed(1) ?? null}
                unit={weight.unit}
              />
            </div>
            <ExpandButton expand={expand} />
          </div>
          <p className="text-muted-foreground -mt-3 text-lg">{rangeLabel(win.from, win.to)}</p>

          <ExpandableChart expand={expand}>
            <WeightTrendChart
              // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
              key={averaging}
              className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
              trend={trendSeries}
              scale={scaleSeries}
              unit={weight.unit}
              today={data.today}
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

          <div className="bg-card text-foreground flex items-center justify-center gap-4 rounded-xl px-3 py-4 text-base whitespace-nowrap min-[360px]:gap-6">
            {legend.scale && (
              <span className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 16"
                  fill="none"
                  stroke={SCALE_COLOR}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="h-4 w-6"
                >
                  <path d="M1 3c4 0 4 10 8 10s4-10 8-10 4 8 6 8" />
                </svg>
                Scale Weight
              </span>
            )}
            {legend.trend && (
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="relative flex h-4 w-6 items-center">
                  <span className="h-0.5 w-full" style={{ backgroundColor: TREND_COLOR }} />
                  <span
                    className="bg-card absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2"
                    style={{ borderColor: TREND_COLOR }}
                  />
                </span>
                Trend Weight
              </span>
            )}
          </div>
          {tutorial === 'show' && (
            <TutorialCard
              steps={WEIGHT_TREND_TUTORIAL}
              tone="purple"
              onDismiss={() => setTutorial('hidden')}
            />
          )}
          <WeightTrendInsights
            changes={data.changes}
            current={data.current ?? null}
            weeklyRate={data.weeklyRate}
            energyKcal={data.energyKcal}
            projection={data.projection ?? null}
            waiting={data.waiting}
          />
          <WeightMonthlyList history={data.history} />
        </>
      )}
    </div>
  )
}
