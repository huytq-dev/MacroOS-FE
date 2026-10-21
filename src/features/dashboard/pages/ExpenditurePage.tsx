'use client'

import { useState } from 'react'
import { GraduationCap, Mountain } from 'lucide-react'
import { SubPageHeader } from '../components/DashboardPage'
import { ExpenditureChart } from '../components/ExpenditurePage/ExpenditureChart'
import { ExpenditureInsights } from '../components/ExpenditurePage/ExpenditureInsights'
import { MonthlyList } from '../components/ExpenditurePage/MonthlyList'
import {
  CollapseChartIcon,
  ExpandChartIcon,
  RangeBar,
  StatBlock,
  TutorialCard,
} from '../components/DetailPage'
import { EXPENDITURE_TUTORIAL } from '../components/ExpenditurePage/expenditure-tutorial-steps'
import { slotsOf, viewWindow } from '../chart/geometry'
import { useChartPan } from '../chart/use-chart-pan'
import { useTween } from '../chart/use-tween'
import { usePersistedChoice } from '../hooks/use-dashboard'
import { useExpenditureDetail } from '../hooks/use-expenditure-detail'
import { rangeLabel, type Averaging, type RangeKey } from '../expenditure.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/**
 * Chi tiết "Expenditure" (bấm ô Expenditure ở Dashboard): Average / Difference của khoảng đang xem, biểu đồ Flux Range (vùng cam liền)
 * + đường Expenditure có marker mỗi ngày KÉO NGANG được để xem các ngày trước, chọn kỳ 1W…All (luôn kết thúc hôm nay, đổi kỳ thì biểu
 * đồ giãn / co mượt) và D/W/M, nút đổi trục (từ 0 ↔ vừa khít dải Flux, trục chạy mượt), chú giải, hướng dẫn, Insights & Data, Data
 * Sources và lịch sử theo tháng.
 */
export function ExpenditurePage() {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const [fit, setFit] = useState(false)
  const [tutorial, setTutorial] = usePersistedChoice(
    'expenditure.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const data = useExpenditureDetail(averaging)
  const total = data.ready ? data.daily.length : 0
  const target = slotsOf(range, total)
  const slots = useTween(target)
  const pan = useChartPan({ maxPos: Math.max(0, total - target), slots })

  if (data.isError) return <ErrorState error={new Error('Could not load Expenditure')} />

  const win = data.ready ? viewWindow(data.today, target, pan.view.snapped) : null
  const inView =
    data.ready && win ? data.daily.filter((day) => day.date >= win.from && day.date <= win.to) : []
  const average = inView.length
    ? Math.round(inView.reduce((sum, day) => sum + day.kcal, 0) / inView.length)
    : null
  const difference = inView.length
    ? Math.round(inView[inView.length - 1].kcal - inView[0].kcal)
    : null

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 md:pb-0">
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

      {!data.ready || data.isLoading || !win ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-10">
              <StatBlock label="Average" value={average?.toString() ?? null} unit="kcal" />
              <StatBlock label="Difference" value={difference?.toString() ?? null} unit="kcal" />
            </div>
            <IconButton
              icon={fit ? CollapseChartIcon : ExpandChartIcon}
              label={fit ? 'Start the axis at zero' : 'Fit the axis to the data'}
              aria-pressed={fit}
              variant="secondary"
              className="size-14 shrink-0 rounded-full"
              onClick={() => setFit((value) => !value)}
            />
          </div>
          <p className="text-muted-foreground -mt-3 text-lg">{rangeLabel(win.from, win.to)}</p>

          <ExpenditureChart
            // Đổi D / W / M thì dữ liệu đổi hình: vẽ lại và hiện dần thay vì nhảy cục
            key={averaging}
            className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:animation-duration-300"
            days={data.days}
            today={data.today}
            slots={slots}
            pos={pan.view.pos}
            fit={fit}
            pan={pan}
          />
          <RangeBar
            range={range}
            onRangeChange={setRange}
            averaging={averaging}
            onAveragingChange={setAveraging}
          />

          <div className="bg-card text-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl px-3 py-4 text-base min-[360px]:gap-x-6">
            <span className="flex items-center gap-2">
              <Mountain
                aria-hidden="true"
                fill="currentColor"
                className="text-mf-tile-protein/70 size-5"
              />
              Flux Range
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="relative flex h-4 w-6 items-center">
                <span className="bg-mf-tile-protein h-0.5 w-full" />
                <span className="border-mf-tile-protein bg-card absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2" />
              </span>
              Expenditure
            </span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="border-mf-tile-protein/70 bg-card size-3 border-2"
              />
              Holding
            </span>
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
            holdingReason={data.holdingReason}
            calibratingDaysLeft={data.calibratingDaysLeft}
          />
          <MonthlyList history={data.history} />
        </>
      )}
    </div>
  )
}
