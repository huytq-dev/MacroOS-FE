'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PeriodList } from '../components/PeriodList'
import { PeriodSheet } from '../components/PeriodSheet'
import {
  useCreatePeriod,
  useDeletePeriod,
  usePeriodHistory,
  useUpdatePeriod,
} from '../hooks/use-period'
import { periodDaySet, periodRangeLabel, summarizePeriods } from '../period.utils'
import type { PeriodRequest } from '../types/period.types'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { HabitGrid } from '@/features/dashboard/components/DashboardPage/TileVisuals'
import { DETAIL_CARD, MetricRow, StatBlock } from '@/features/dashboard/components/DetailPage'
import { HABIT_DAYS, lastDays } from '@/features/dashboard/dashboard.utils'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsClient } from '@/hooks/use-is-client'
import { isConflictError } from '@/lib/api'
import { todayIso } from '@/lib/date'

/**
 * Trang Period (bấm ô Period ở Dashboard): "N days ago" kể từ lần bắt đầu gần nhất, độ dài chu kỳ trung bình, lưới 30 ngày, Insights và
 * danh sách các kỳ theo tháng; dấu + hoặc bút chì mở bảng thêm / sửa (Start / End Date, Symptoms, Notes, thùng rác khi đang sửa).
 * Trùng ngày bắt đầu (409) báo ngay trong bảng; BE tự tính độ dài chu kỳ.
 */
export function PeriodPage() {
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const history = usePeriodHistory(today)
  // Kỳ giữ nguyên khi đóng bảng để nội dung không đổi lúc đang trượt xuống
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const create = useCreatePeriod()
  const update = useUpdatePeriod()
  const remove = useDeletePeriod()

  const entries = history.data?.items ?? []
  const entry = entries.find((item) => item.id === sheetId) ?? null

  const openSheet = (id: string | null) => {
    setSaveError(null)
    setSheetId(id)
    setSheetOpen(true)
  }

  const save = (payload: PeriodRequest) => {
    const options = {
      onSuccess: () => setSheetOpen(false),
      onError: (error: unknown) =>
        setSaveError(
          isConflictError(error)
            ? 'A period starting on this date already exists. Edit that one instead.'
            : getFormErrorMessage(error)
        ),
    }
    if (entry) update.mutate({ id: entry.id, payload }, options)
    else create.mutate(payload, options)
  }

  const header = (
    <SubPageHeader
      title="Period"
      action={
        <IconButton
          icon={Plus}
          label="Add period"
          className="size-11"
          onClick={() => openSheet(null)}
        />
      }
    />
  )

  if (history.isError)
    return <ErrorState error={history.error} onRetry={() => void history.refetch()} />

  if (!today || history.isLoading)
    return (
      <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5">
        {header}
        <Skeleton className="h-24 rounded-xl" aria-busy="true" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )

  const { cycleDays, periodDays } = summarizePeriods(entries)
  const daysAgo = history.data?.daysSinceLastStart ?? null
  const periodSet = periodDaySet(entries)
  const confirmEntry = entries.find((item) => item.id === confirmId)

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 md:pb-0">
      {header}

      <div className="flex gap-10">
        <StatBlock
          label="Last Period Started"
          value={daysAgo === null ? null : String(daysAgo)}
          unit="days ago"
        />
        <StatBlock
          label="Avg Cycle"
          value={cycleDays === null ? null : String(cycleDays)}
          unit="days"
        />
      </div>

      <section aria-label="Last 30 days" className={`${DETAIL_CARD} space-y-3 p-4`}>
        <h2 className="text-lg">Last 30 Days</h2>
        <HabitGrid
          cells={lastDays(today, HABIT_DAYS).map((day) => periodSet.has(day))}
          tone="bg-mf-tile-protein"
        />
      </section>

      {entries.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl p-4 text-base">
          No periods logged yet. Tap + to add the first one.
        </p>
      ) : (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:animation-duration-300 flex flex-col gap-5">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Insights & Data</h2>
            <section aria-label="Period insights" className={`${DETAIL_CARD} space-y-5 p-4`}>
              <MetricRow
                value={cycleDays === null ? '---' : String(cycleDays)}
                unit="days"
                title="Average Cycle"
                text="Average number of days between the start of one period and the next."
              />
              <MetricRow
                value={periodDays === null ? '---' : String(periodDays)}
                unit="days"
                title="Average Period"
                text="Average number of days your period lasts."
              />
            </section>
          </div>
          <PeriodList entries={entries} onEdit={openSheet} />
        </div>
      )}

      <PeriodSheet
        key={`${sheetId}-${history.dataUpdatedAt}`}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        entry={entry}
        today={today}
        isPending={create.isPending || update.isPending}
        error={saveError}
        onSave={save}
        onDelete={entry ? () => setConfirmId(entry.id) : undefined}
      />

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="Delete this period?"
        description={
          confirmEntry
            ? `Delete the period ${periodRangeLabel(confirmEntry)}. Cycle lengths are recalculated.`
            : ''
        }
        confirmLabel="Delete period"
        pendingLabel="Deleting..."
        isPending={remove.isPending}
        onConfirm={() =>
          confirmId &&
          remove.mutate(confirmId, {
            onSuccess: () => {
              setConfirmId(null)
              setSheetOpen(false)
            },
          })
        }
      />
    </div>
  )
}
