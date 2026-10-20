'use client'

import { useState } from 'react'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { useCurrentProgram } from '@/features/program/hooks/use-program'
import { useFullBodyHistory } from '@/features/shortcuts/hooks/use-body-metrics'
import { SelectDateSheet } from '@/features/weight/components/BodyMetricPage'
import { todayIso } from '@/lib/date'
import {
  EventIcon,
  FullBodyHeader,
  ComparePills,
  CompareSections,
  MetricDateTabs,
  SwipeArea,
  type CompareSide,
} from '../components/FullBodyPage'

/**
 * Compare All Metrics (MacroFactor): "Comparing [A] to [B]" — pill trắng là ngày mà tab, vuốt và lịch đang đổi; mặc định so
 * ngày áp chót với ngày mới nhất. Mỗi hàng có thay đổi ↗/↘ tô xanh/đỏ theo mục tiêu của chương trình.
 */
export function CompareMetricsPage() {
  const history = useFullBodyHistory()
  const program = useCurrentProgram()
  const [today] = useState(() => todayIso())
  const [picked, setPicked] = useState<{ from?: string; to?: string }>({})
  const [active, setActive] = useState<CompareSide>('from')
  const [calendarOpen, setCalendarOpen] = useState(false)

  const items = history.data ?? []
  const dates = items.map((item) => item.date).reverse()
  const valid = (date: string | undefined) => (date && dates.includes(date) ? date : undefined)
  const from = valid(picked.from) ?? dates.at(-2) ?? dates.at(-1)
  const to = valid(picked.to) ?? dates.at(-1)
  const current = active === 'from' ? from : to

  const select = (next: string) => setPicked((state) => ({ ...state, [active]: next }))
  const step = (offset: 1 | -1) => {
    const next = current ? dates[dates.indexOf(current) + offset] : undefined
    if (next) select(next)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-24 md:pb-0">
      <FullBodyHeader flush>
        <SubPageHeader
          title="Compare All Metrics"
          action={
            <IconButton
              icon={EventIcon}
              label="Select date"
              className="size-11 [&_svg]:size-7!"
              disabled={!current}
              onClick={() => setCalendarOpen(true)}
            />
          }
        />
        {from && to && current && (
          <>
            <ComparePills from={from} to={to} active={active} onActiveChange={setActive} />
            <MetricDateTabs dates={dates} value={current} onChange={select} />
          </>
        )}
      </FullBodyHeader>
      {history.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="mx-auto h-11 w-72 rounded-full" />
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
      ) : from && to && current ? (
        <>
          <SwipeArea onNext={() => step(1)} onPrevious={() => step(-1)}>
            <CompareSections
              from={items.find((item) => item.date === from)}
              to={items.find((item) => item.date === to)}
              fromDate={from}
              toDate={to}
              goalType={program.data?.goalType}
            />
          </SwipeArea>
          <SelectDateSheet
            key={`${active}-${current}`}
            open={calendarOpen}
            onOpenChange={setCalendarOpen}
            value={current}
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
