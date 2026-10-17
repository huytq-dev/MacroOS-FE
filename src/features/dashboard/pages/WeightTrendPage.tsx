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
  WEIGHT_TREND_TUTORIAL,
  WeightMonthlyList,
  WeightTrendChart,
  WeightTrendInsights,
} from '../components/WeightTrendPage'
import { usePersistedChoice } from '../hooks/use-dashboard'
import { useWeightTrendDetail } from '../hooks/use-weight-trend-detail'
import type { Averaging, RangeKey } from '../expenditure.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/**
 * Chi tiết "Weight Trend" (bấm ô Weight Trend ở Dashboard): Average/Difference của kỳ, biểu đồ số cân + xu hướng,
 * chọn kỳ 1W…All và D/W/M, phóng to biểu đồ, hướng dẫn, Insights & Data và danh sách theo tháng.
 */
export function WeightTrendPage() {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const [expanded, setExpanded] = useState(false)
  const [tutorial, setTutorial] = usePersistedChoice(
    'weight-trend.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const data = useWeightTrendDetail(range, averaging)

  if ('isError' in data && data.isError)
    return <ErrorState error={new Error('Could not load Weight Trend')} />

  return (
    <div className="flex max-w-2xl flex-col gap-5 md:pb-0">
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

      {data.isLoading || !('win' in data) ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-10">
              <StatBlock label="Average" value={data.average?.toFixed(1) ?? null} unit="kg" />
              <StatBlock label="Difference" value={data.difference?.toFixed(1) ?? null} unit="kg" />
            </div>
            <IconButton
              icon={expanded ? CollapseChartIcon : ExpandChartIcon}
              label={expanded ? 'Shrink chart' : 'Expand chart'}
              variant="secondary"
              className="size-14 rounded-full"
              onClick={() => setExpanded((value) => !value)}
            />
          </div>
          <p className="text-muted-foreground -mt-3 text-lg">{data.label}</p>

          <WeightTrendChart
            points={data.shown}
            range={range}
            height={expanded ? 460 : 300}
            className="transition-[height] duration-300"
          />
          <RangeBar
            range={range}
            onRangeChange={setRange}
            averaging={averaging}
            onAveragingChange={setAveraging}
          />

          {!expanded && (
            <>
              <div className="bg-card text-foreground flex items-center justify-center gap-6 rounded-xl px-4 py-4 text-base">
                <span className="flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="text-mf-purple/60 h-4 w-6"
                  >
                    <path d="M2 4l5 8 5-6 4 6 6-9" />
                  </svg>
                  Scale Weight
                </span>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="relative flex h-4 w-6 items-center">
                    <span className="bg-mf-purple h-0.5 w-full" />
                    <span className="border-mf-purple bg-card absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2" />
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
                weeklyRate={data.weeklyRate ?? 0}
                energyKcal={data.energyKcal ?? 0}
                projection={data.projection ?? null}
              />
              <WeightMonthlyList months={data.months} />
            </>
          )}
        </>
      )}
    </div>
  )
}
