'use client'

import { useState } from 'react'
import { GraduationCap, Mountain } from 'lucide-react'
import { SubPageHeader } from '../components/DashboardPage'
import { ExpenditureChart } from '../components/ExpenditurePage/ExpenditureChart'
import { ExpenditureInsights } from '../components/ExpenditurePage/ExpenditureInsights'
import { HoldingNotice } from '../components/ExpenditurePage/HoldingNotice'
import { MonthlyList } from '../components/ExpenditurePage/MonthlyList'
import { RangeBar, StatBlock, TutorialCard } from '../components/DetailPage'
import { EXPENDITURE_TUTORIAL } from '../components/ExpenditurePage/expenditure-tutorial-steps'
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
import { useExpenditureDetail } from '../hooks/use-expenditure-detail'
import { rangeLabel, type Averaging, type RangeKey } from '../expenditure.utils'
import { expLegend } from '../expenditure-series'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { useUnits } from '@/features/users/hooks/use-units'
import { cn } from '@/lib/utils'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/**
 * Chi tiết "Expenditure" (bấm ô Expenditure ở Dashboard): Average / Difference của khoảng đang xem, biểu đồ đường Expenditure + dải Flux Range của BE
 * (chỉ khi BE trả dải) có marker mỗi ngày KÉO NGANG được để xem các ngày trước, chọn kỳ 1W…All (luôn kết thúc hôm nay, đổi kỳ thì biểu
 * đồ giãn / co mượt) và D/W/M, nút phóng to (biểu đồ cao gần hết màn hình, chiều cao chạy mượt; trục y luôn vừa khít đường và dải), chú giải, hướng dẫn, Insights & Data, Data
 * Sources và lịch sử theo tháng.
 */
export function ExpenditurePage() {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const expand = useChartExpand()
  const [tutorial, setTutorial] = usePersistedChoice(
    'expenditure.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const data = useExpenditureDetail(averaging)
  const derived = useDerivedGate()
  const total = data.ready ? data.daily.length : 0
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })
  const { energy } = useUnits()

  if (data.isError)
    return (
      <ErrorState
        error={new Error('Could not load Expenditure')}
        onRetry={data.refetch}
        isRetrying={data.isFetching}
      />
    )

  const win = data.ready ? viewWindow(data.today, target, pan.view.snapped) : null
  const inView =
    data.ready && win ? data.daily.filter((day) => day.date >= win.from && day.date <= win.to) : []
  const legend = expLegend(inView)
  // Số hiển thị: đổi sang kcal / kJ của user rồi mới làm tròn (BE và các phép tính vẫn theo kcal)
  const average = inView.length
    ? Math.round(energy.convert(inView.reduce((sum, day) => sum + day.kcal, 0) / inView.length))
    : null
  const difference = inView.length
    ? Math.round(energy.convert(inView[inView.length - 1].kcal - inView[0].kcal))
    : null
  // Biểu đồ vẽ theo đơn vị của user để vạch trục và chú thích đúng đơn vị đó
  const factor = energy.convert(1)
  const chartDays = data.ready
    ? data.days.map((day) => ({
        ...day,
        kcal: day.kcal * factor,
        fluxLow: day.fluxLow === null ? null : day.fluxLow * factor,
        fluxHigh: day.fluxHigh === null ? null : day.fluxHigh * factor,
      }))
    : []

  return (
    <div
      aria-busy={derived.gate === 'updating'}
      className={cn(
        'flex w-full max-w-2xl min-w-0 flex-col gap-5 transition-opacity md:pb-0',
        // BE đang dựng lại: giữ nguyên biểu đồ và số cũ (làm mờ, không thay bằng khung xám làm trang co lại); số mới tự thay khi xong
        derived.gate === 'updating' && 'opacity-60'
      )}
    >
      <SubPageHeader
        title="Expenditure"
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
      ) : !data.ready || data.isLoading || !win ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div
              role="group"
              aria-label="Average and Difference of the Expenditure line"
              title="Average and Difference of the Expenditure line over the dates shown"
              className="flex gap-10"
            >
              <StatBlock label="Average" value={average?.toString() ?? null} unit={energy.unit} />
              <StatBlock
                label="Difference"
                value={difference?.toString() ?? null}
                unit={energy.unit}
              />
            </div>
            <ExpandButton expand={expand} />
          </div>
          <p className="text-muted-foreground -mt-3 text-lg">{rangeLabel(win.from, win.to)}</p>

          {data.holdingNotice && <HoldingNotice notice={data.holdingNotice} />}

          <ExpandableChart expand={expand}>
            <ExpenditureChart
              // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
              key={averaging}
              className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
              days={chartDays}
              unit={energy.unit}
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

          <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:animation-duration-300 flex flex-col gap-5">
            <div className="bg-card text-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl px-3 py-4 text-base min-[360px]:gap-x-6">
              {legend.flux && (
                <span className="flex items-center gap-2">
                  <Mountain
                    aria-hidden="true"
                    data-flux-legend=""
                    className="text-mf-flux-band fill-mf-flux-band/50 size-4"
                  />
                  Flux Range
                </span>
              )}
              {legend.line && (
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="relative flex h-4 w-6 items-center">
                    <span className="bg-mf-tile-protein h-0.5 w-full" />
                    {legend.updating && (
                      <span className="border-mf-tile-protein bg-card absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2" />
                    )}
                  </span>
                  Expenditure
                </span>
              )}
              {legend.holding && (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="border-mf-tile-protein/70 bg-card size-3 border-2"
                  />
                  Holding
                </span>
              )}
            </div>
            {tutorial === 'show' && (
              <TutorialCard
                steps={EXPENDITURE_TUTORIAL}
                tone="brown"
                onDismiss={() => setTutorial('hidden')}
              />
            )}
            <ExpenditureInsights
              changes={data.changes}
              current={data.current}
              strategy={data.strategy}
              holdingReasons={data.holdingReasons}
            />
            <MonthlyList history={data.history} />
          </div>
        </>
      )}
    </div>
  )
}
