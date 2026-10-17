'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { SubPageHeader } from '../components/DashboardPage'
import {
  CollapseChartIcon,
  ExpandChartIcon,
  SparkChartIcon,
  StatBlock,
  TutorialCard,
  UnderlineTabs,
} from '../components/DetailPage'
import {
  GOAL_PROGRESS_TUTORIAL,
  GoalInsights,
  WaterfallChart,
} from '../components/GoalProgressPage'
import { usePersistedChoice } from '../hooks/use-dashboard'
import { useGoalProgressDetail } from '../hooks/use-goal-progress-detail'
import type { GoalTab } from '../goal-progress.utils'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'

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

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

/**
 * Chi tiết "Goal Progress" (bấm ô Goal Progress ở Dashboard): hai tab Scale Weight / Trend Weight, khoảng cách còn lại tới
 * cân mục tiêu, biểu đồ thác nước, hướng dẫn và Insights & Data.
 */
export function GoalProgressPage() {
  const [tab, setTab] = useState<GoalTab>('scale')
  const [expanded, setExpanded] = useState(false)
  const [tutorial, setTutorial] = usePersistedChoice(
    'goal-progress.tutorial',
    'show',
    TUTORIAL_CHOICES
  )
  const data = useGoalProgressDetail(tab)

  if (data.status === 'error')
    return <ErrorState error={new Error('Could not load Goal Progress')} />

  return (
    <div style={THEME[tab]} className="flex max-w-2xl flex-col gap-5 md:pb-0">
      <SubPageHeader title="Goal Progress" />
      <UnderlineTabs tabs={TABS} value={tab} onChange={setTab} ariaLabel="Weight basis" />

      {data.status === 'loading' && <Skeleton className="h-96 rounded-xl" aria-busy="true" />}
      {data.status === 'empty' && (
        <p className="bg-card text-muted-foreground rounded-xl p-4 text-base">
          Set a target weight in your goal to see your progress here.
        </p>
      )}
      {data.status === 'ready' && (
        <>
          <div className="flex items-start justify-between gap-3">
            <StatBlock label="Distance" value={data.distance.toFixed(1)} unit="kg" />
            <IconButton
              icon={expanded ? CollapseChartIcon : ExpandChartIcon}
              label={expanded ? 'Shrink chart' : 'Expand chart'}
              variant="secondary"
              className="size-14 rounded-full"
              onClick={() => setExpanded((value) => !value)}
            />
          </div>
          <p className="text-muted-foreground -mt-3 text-lg">{shortDate(data.startDate)} – Today</p>

          <WaterfallChart
            bars={data.bars}
            height={expanded ? 460 : 340}
            className="transition-[height] duration-300"
          />

          {!expanded && (
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
          )}
        </>
      )}
    </div>
  )
}
