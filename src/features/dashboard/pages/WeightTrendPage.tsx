'use client'

import { useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { SubPageHeader } from '../components/DashboardPage'
import {
  CollapseChartIcon,
  ExpandChartIcon,
  RangeBar,
  StatBlock,
  TutorialCard,
} from '../components/DetailPage'
import {
  SCALE_COLOR,
  TREND_COLOR,
  WEIGHT_TREND_TUTORIAL,
  WeightMonthlyList,
  WeightTrendChart,
  WeightTrendInsights,
} from '../components/WeightTrendPage'
import { usePersistedChoice } from '../hooks/use-dashboard'
import { useWeightTrendDetail } from '../hooks/use-weight-trend-detail'
import { rangeLabel, type Averaging, type RangeKey } from '../expenditure.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/**
 * Chi tiết "Weight Trend" (bấm ô Weight Trend ở Dashboard): Average / Difference của kỳ, biểu đồ hai đường (Scale Weight tím đậm nối
 * các lần cân, Trend Weight tím nhạt có vòng tròn mỗi ngày), chọn kỳ 1W…All (luôn kết thúc hôm nay) và D/W/M, nút đổi trục (từ 0 ↔ vừa
 * khít dữ liệu), chú giải, hướng dẫn (mũ tốt nghiệp ở góc phải mở / ẩn), Insights & Data, Data Sources và lịch sử theo tháng.
 */
export function WeightTrendPage() {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const [fit, setFit] = useState(false)
  const [tutorial, setTutorial] = usePersistedChoice(
    'weight-trend.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const data = useWeightTrendDetail(range, averaging)

  if (data.isError) return <ErrorState error={new Error('Could not load Weight Trend')} />

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

      {!data.ready || data.isLoading ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-10">
              <StatBlock label="Average" value={data.average?.toFixed(1) ?? null} unit="kg" />
              <StatBlock label="Difference" value={data.difference?.toFixed(1) ?? null} unit="kg" />
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
          <p className="text-muted-foreground -mt-3 text-lg">
            {rangeLabel(data.win.from, data.win.to)}
          </p>

          <WeightTrendChart trend={data.trend} scale={data.scale} span={data.win} fit={fit} />
          <RangeBar
            range={range}
            onRangeChange={setRange}
            averaging={averaging}
            onAveragingChange={setAveraging}
          />

          <div className="bg-card text-foreground flex items-center justify-center gap-4 rounded-xl px-3 py-4 text-base whitespace-nowrap min-[360px]:gap-6">
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
          </div>
          {tutorial === 'show' && (
            <TutorialCard
              steps={WEIGHT_TREND_TUTORIAL}
              tone="purple"
              onDismiss={() => setTutorial('hidden')}
            />
          )}
          <WeightTrendInsights
            changes={data.changes ?? []}
            current={data.current ?? null}
            weeklyRate={data.weeklyRate}
            energyKcal={data.energyKcal}
            projection={data.projection ?? null}
          />
          <WeightMonthlyList history={data.history} />
        </>
      )}
    </div>
  )
}
