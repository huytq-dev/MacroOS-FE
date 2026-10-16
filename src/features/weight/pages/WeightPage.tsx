'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useDeleteWeight, useUpsertWeight, useWeights } from '../hooks/use-weights'
import { logWeightSchema, type LogWeightFormValues } from '../schemas/log-weight.schema'
import {
  LogWeightDialog,
  WeightChart,
  WeightSummaryCards,
  WeightTable,
} from '../components/WeightPage'
import type { WeightEntry } from '../types/weight.types'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useIsClient } from '@/hooks/use-is-client'
import { addDaysIso, formatDateVi, todayIso } from '@/lib/date'

const RANGES = [
  { label: '2W', days: 14 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
] as const

export function WeightPage() {
  // "Hôm nay" chỉ tính sau khi mount (server và lần render đầu đều null → không lệch hydration)
  const isClient = useIsClient()
  const today = isClient ? todayIso() : null
  const [rangeDays, setRangeDays] = useState<number>(30)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WeightEntry | null>(null)

  const from = today ? addDaysIso(today, -rangeDays) : null
  const weights = useWeights(from, today)
  const upsert = useUpsertWeight()
  const remove = useDeleteWeight()

  const form = useForm<LogWeightFormValues>({
    resolver: zodResolver(logWeightSchema),
    mode: 'onTouched',
    defaultValues: { logDate: '', weightKg: Number.NaN, notes: '' },
  })

  const openDialog = () => {
    form.reset({
      logDate: todayIso(),
      weightKg: weights.data?.latestWeightKg ?? Number.NaN,
      notes: '',
    })
    upsert.reset()
    setDialogOpen(true)
  }

  const onSubmit = (values: LogWeightFormValues) =>
    upsert.mutate(
      { logDate: values.logDate, weightKg: values.weightKg, notes: values.notes?.trim() || null },
      { onSuccess: () => setDialogOpen(false) }
    )

  if (weights.isError)
    return <ErrorState error={weights.error} onRetry={() => void weights.refetch()} />

  const isLoading = !today || weights.isLoading
  const addButton = (
    <Button size="sm" onClick={openDialog}>
      <Plus aria-hidden="true" /> Ghi cân
    </Button>
  )

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <PageHeader title="Cân nặng" action={addButton} />

      <WeightSummaryCards data={weights.data ?? undefined} isLoading={isLoading} />

      <Card className="gap-0 overflow-hidden rounded-2xl py-0">
        <div className="px-3 py-2.5">
          <ToggleGroup
            type="single"
            value={String(rangeDays)}
            onValueChange={(next) => next && setRangeDays(Number(next))}
            aria-label="Khoảng thời gian"
            spacing={1}
            className="justify-start overflow-x-auto"
          >
            {RANGES.map((range) => (
              <ToggleGroupItem
                key={range.label}
                value={String(range.days)}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 shrink-0 rounded-full px-3.5 text-xs"
              >
                {range.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="px-2 pb-3">
          {isLoading ? (
            <Skeleton className="h-48 w-full" aria-busy="true" />
          ) : (
            <WeightChart items={weights.data?.items ?? []} />
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <WeightTable
          items={weights.data?.items ?? []}
          onRequestDelete={setDeleteTarget}
          emptyAction={addButton}
        />
      )}

      <LogWeightDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        isPending={upsert.isPending}
        error={upsert.error ? getFormErrorMessage(upsert.error) : null}
        onSubmit={onSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá lần cân này?"
        description={
          deleteTarget
            ? `Xoá ${deleteTarget.weightKg.toFixed(1)} kg ngày ${formatDateVi(deleteTarget.logDate)}. Trend và expenditure được tính lại từ ngày đó.`
            : ''
        }
        confirmLabel="Xoá lần cân"
        pendingLabel="Đang xoá..."
        isPending={remove.isPending}
        onConfirm={() =>
          deleteTarget &&
          remove.mutate(deleteTarget.logDate, { onSuccess: () => setDeleteTarget(null) })
        }
      />
    </div>
  )
}
