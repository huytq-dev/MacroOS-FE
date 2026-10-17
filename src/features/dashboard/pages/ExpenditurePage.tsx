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
import { usePersistedChoice } from '../hooks/use-dashboard'
import { useExpenditureDetail } from '../hooks/use-expenditure-detail'
import type { Averaging, RangeKey } from '../expenditure.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/**
 * Chi tiết "Expenditure" (bấm ô Expenditure ở Dashboard): Average/Difference của kỳ, biểu đồ flux + đường expenditure,
 * chọn kỳ 1W…All và D/W/M, phóng to biểu đồ, hướng dẫn, Insights & Data và danh sách theo tháng.
 */
export function ExpenditurePage() {
  const [range, setRange] = useState<RangeKey>('1W')
  const [averaging, setAveraging] = useState<Averaging>('daily')
  const [expanded, setExpanded] = useState(false)
  const [tutorial, setTutorial] = usePersistedChoice(
    'expenditure.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const data = useExpenditureDetail(range, averaging)

  if ('isError' in data && data.isError)
    return <ErrorState error={new Error('Could not load Expenditure')} />

  const last = data.all[data.all.length - 1]
  const holding = last ? last.holding : true

  return (
    <div className="flex max-w-2xl flex-col gap-5 md:pb-0">
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

      {data.isLoading || !('win' in data) ? (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-10">
              <StatBlock label="Average" value={data.average?.toString() ?? null} unit="kcal" />
              <StatBlock
                label="Difference"
                value={data.difference?.toString() ?? null}
                unit="kcal"
              />
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

          <ExpenditureChart
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
                    className="border-mf-tile-protein/60 bg-mf-tile-protein/20 size-3 border-2"
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
                all={data.all}
                today={data.today ?? ''}
                current={data.current?.estimatedTdeeKcal ?? null}
                holding={holding}
                holdingReason={data.holdingReason}
                changes={data.changes}
              />
              <MonthlyList months={data.months} />
            </>
          )}
        </>
      )}
    </div>
  )
}
