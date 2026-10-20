'use client'

import { useState } from 'react'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { useFullBodyHistory } from '@/features/shortcuts/hooks/use-body-metrics'
import { SelectDateSheet } from '@/features/weight/components/BodyMetricPage'
import { todayIso } from '@/lib/date'
import {
  EventIcon,
  FullBodyHeader,
  MetricDateTabs,
  MetricSections,
  SwipeArea,
} from '../components/FullBodyPage'

/**
 * All Metrics (MacroFactor): ‹ "All Metrics" + lịch; tab ngày có số đo (cũ → mới, vạch trượt), vuốt ngang để đổi ngày; mọi
 * số đo của ngày đang chọn theo nhóm. Mặc định là ngày mới nhất.
 */
export function AllMetricsPage() {
  const history = useFullBodyHistory()
  const [today] = useState(() => todayIso())
  const [picked, setPicked] = useState<string | null>(null)
  const [direction, setDirection] = useState<'back' | 'forward' | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const items = history.data ?? []
  const dates = items.map((item) => item.date).reverse()
  const date = picked && dates.includes(picked) ? picked : (dates.at(-1) ?? null)
  const item = items.find((entry) => entry.date === date)

  const select = (next: string) => {
    if (!date || next === date) return
    setDirection(next > date ? 'forward' : 'back')
    setPicked(next)
  }
  const step = (offset: 1 | -1) => {
    const next = date ? dates[dates.indexOf(date) + offset] : undefined
    if (next) select(next)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-24 md:pb-0">
      <FullBodyHeader flush>
        <SubPageHeader
          title="All Metrics"
          action={
            <IconButton
              icon={EventIcon}
              label="Select date"
              className="size-11 [&_svg]:size-7!"
              disabled={!date}
              onClick={() => setCalendarOpen(true)}
            />
          }
        />
        {dates.length > 0 && date && (
          <MetricDateTabs dates={dates} value={date} onChange={select} />
        )}
      </FullBodyHeader>
      {history.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12 rounded" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : history.isError ? (
        <ErrorState
          error={history.error}
          variant="inline"
          onRetry={() => void history.refetch()}
          isRetrying={history.isFetching}
        />
      ) : date && item ? (
        <>
          <SwipeArea onNext={() => step(1)} onPrevious={() => step(-1)}>
            <MetricSections item={item} direction={direction} />
          </SwipeArea>
          <SelectDateSheet
            key={date}
            open={calendarOpen}
            onOpenChange={setCalendarOpen}
            value={date}
            today={today}
            isDateEnabled={(iso) => dates.includes(iso)}
            onSelect={select}
          />
        </>
      ) : (
        <p className="text-muted-foreground py-10 text-center">No measurements yet.</p>
      )}
    </div>
  )
}
