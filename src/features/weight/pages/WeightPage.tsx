'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useDeleteWeight, useUpsertWeight, useWeights } from '../hooks/use-weights'
import { logWeightSchema, type LogWeightFormValues } from '../schemas/log-weight.schema'
import { LogWeightDialog, WeightChart, WeightSummaryCards, WeightTable } from '../components/WeightPage'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { addDaysIso, todayIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useIsClient } from '@/hooks/use-is-client'

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

  const from = today ? addDaysIso(today, -rangeDays) : null
  const weights = useWeights(from, today)
  const upsert = useUpsertWeight()
  const remove = useDeleteWeight()

  const form = useForm<LogWeightFormValues>({
    resolver: zodResolver(logWeightSchema),
    defaultValues: { logDate: '', weightKg: Number.NaN, notes: '' },
  })

  const openDialog = () => {
    form.reset({ logDate: todayIso(), weightKg: weights.data?.latestWeightKg ?? Number.NaN, notes: '' })
    setDialogOpen(true)
  }

  const onSubmit = (values: LogWeightFormValues) =>
    upsert.mutate(
      { logDate: values.logDate, weightKg: values.weightKg, notes: values.notes?.trim() || null },
      { onSuccess: () => setDialogOpen(false) }
    )

  if (weights.isError) return <ErrorState error={weights.error} onRetry={() => void weights.refetch()} />

  const isLoading = !today || weights.isLoading

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Cân nặng</h1>
        <Button size="sm" onClick={openDialog}>
          <Plus /> Ghi cân
        </Button>
      </div>

      <WeightSummaryCards data={weights.data ?? undefined} isLoading={isLoading} />

      <div className="bg-card rounded-lg border">
        <div className="flex items-center gap-1 overflow-x-auto border-b px-2 py-1.5">
          {RANGES.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() => setRangeDays(range.days)}
              aria-pressed={rangeDays === range.days}
              className={cn(
                'h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors',
                rangeDays === range.days ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="p-2">{isLoading ? <Skeleton className="h-48 w-full" /> : <WeightChart items={weights.data?.items ?? []} />}</div>
      </div>

      <div className="bg-card overflow-auto rounded-lg border">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <WeightTable items={weights.data?.items ?? []} isDeleting={remove.isPending} onDelete={(logDate) => remove.mutate(logDate)} />
        )}
      </div>

      <LogWeightDialog open={dialogOpen} onOpenChange={setDialogOpen} form={form} isPending={upsert.isPending} onSubmit={onSubmit} />
    </div>
  )
}
