'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { SubPageHeader } from '../components/DashboardPage'
import { SparkChartIcon, StatBlock, TutorialCard, UnderlineTabs } from '../components/DetailPage'
import {
  GOAL_PROGRESS_TUTORIAL,
  GoalInsights,
  WaterfallChart,
} from '../components/GoalProgressPage'
import { ExpandableChart, ExpandButton, useChartExpand } from '../chart/use-chart-expand'
import { usePersistedChoice } from '../hooks/use-dashboard'
import { useGoalProgressDetail } from '../hooks/use-goal-progress-detail'
import { DerivedFailed } from '@/features/derived-data/components/DerivedFailed'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import type { GoalTab } from '../goal-progress.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useUnits } from '@/features/users/hooks/use-units'
import { formatDate } from '@/lib/date'

const TUTORIAL_CHOICES = ['show', 'hidden'] as const

/** Màu theo tab: xanh lá cho số cân thô, tím cho xu hướng; đổi tab thì mọi thứ dùng biến này chuyển màu dần (500ms). */
const THEME: Record<GoalTab, React.CSSProperties> = {
  scale: {
    '--goal-away': '#5dba85',
    '--goal-toward': '#17573b',
    '--goal-status': '#3a3a3a',
  } as React.CSSProperties,
  trend: {
    '--goal-away': '#b48cf8',
    '--goal-toward': '#5b3aa8',
    '--goal-status': '#3a3a3a',
  } as React.CSSProperties,
}

const TABS = [
  {
    value: 'scale' as const,
    label: 'Scale Weight',
    icon: <TrendingUp aria-hidden="true" className="size-5" />,
  },
  {
    value: 'trend' as const,
    label: 'Trend Weight',
    icon: <SparkChartIcon className="size-5" />,
  },
] as const

/**
 * Chi tiết "Goal Progress" (bấm ô Goal Progress ở Dashboard): hai tab Scale Weight / Trend Weight, khoảng cách còn lại tới
 * cân mục tiêu, biểu đồ thác nước, hướng dẫn và Insights & Data.
 */
export function GoalProgressPage() {
  const [tab, setTab] = useState<GoalTab>('scale')
  const expand = useChartExpand(340)
  const [tutorial, setTutorial] = usePersistedChoice(
    'goal-progress.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const data = useGoalProgressDetail(tab)
  const derived = useDerivedGate()
  const { weight } = useUnits()

  if (data.status === 'error')
    return (
      <ErrorState
        error={new Error('Could not load Goal Progress')}
        onRetry={data.refetch}
        isRetrying={data.isRetrying}
      />
    )

  return (
    <div
      style={THEME[tab]}
      aria-busy={derived.gate === 'updating'}
      className={cn(
        'flex w-full max-w-2xl min-w-0 flex-col gap-5 transition-opacity md:pb-0',
        // BE đang dựng lại: giữ nguyên biểu đồ và số cũ (làm mờ, không thay bằng khung xám làm trang co lại); số mới tự thay khi xong
        derived.gate === 'updating' && 'opacity-60'
      )}
    >
      <SubPageHeader title="Goal Progress" />
      <UnderlineTabs tabs={TABS} value={tab} onChange={setTab} ariaLabel="Weight basis" />

      {derived.gate === 'failed' && (
        <DerivedFailed onRetry={derived.retry} isRetrying={derived.isRetrying} />
      )}
      {derived.gate !== 'failed' && data.status === 'loading' && (
        <Skeleton className="h-96 rounded-xl" aria-busy="true" />
      )}
      {derived.gate !== 'failed' && data.status === 'empty' && (
        <p className="bg-card text-muted-foreground rounded-xl p-4 text-base">
          Set a target weight in your goal to see your progress here.
        </p>
      )}
      {derived.gate !== 'failed' && data.status === 'ready' && (
        <>
          <div className="flex items-start justify-between gap-3">
            <StatBlock label="Distance" value={weight.format(data.distance)} unit={weight.unit} />
            <ExpandButton expand={expand} />
          </div>
          <p className="text-muted-foreground -mt-3 text-lg">
            {formatDate(data.startDate)} – Today
          </p>
          {data.reached && (
            <p role="status" className="text-foreground -mt-2 text-base font-medium">
              Goal reached
              {data.pastKg >= 0.05 && (
                <span className="text-muted-foreground font-normal">
                  {' '}
                  · {weight.text(data.pastKg)} past your target
                </span>
              )}
            </p>
          )}

          <ExpandableChart expand={expand}>
            <WaterfallChart bars={data.bars} height={expand.height} />
          </ExpandableChart>

          <>
            <div className="bg-card text-foreground flex items-center justify-center gap-6 rounded-xl px-4 py-4 text-base">
              {[
                ['Away', 'var(--goal-away)'],
                ['Towards', 'var(--goal-toward)'],
              ].map(([label, color]) => (
                <span key={label} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: color }}
                    className="size-3.5 rounded-xs transition-colors duration-500"
                  />
                  {label}
                </span>
              ))}
            </div>
            {tutorial === 'show' && (
              <TutorialCard
                steps={GOAL_PROGRESS_TUTORIAL}
                tone={tab === 'scale' ? 'green' : 'purple'}
                onDismiss={() => setTutorial('hidden')}
              />
            )}
            <GoalInsights
              tab={tab}
              targetKg={data.targetKg}
              durationDays={data.duration}
              eta={data.eta}
            />
          </>
        </>
      )}
    </div>
  )
}
