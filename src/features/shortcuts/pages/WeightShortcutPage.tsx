'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { LogWeightDialog } from '@/features/weight/components/WeightPage'
import { useDeleteWeight, useUpsertWeight, useWeights } from '@/features/weight/hooks/use-weights'
import {
  logWeightSchema,
  type LogWeightFormValues,
} from '@/features/weight/schemas/log-weight.schema'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { addDaysIso, formatDate, todayIso } from '@/lib/date'

interface WeightShortcutPageProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Các ngày gần đây có thể đã có bản ghi (để hiện nút Delete khi chọn đúng ngày đó). */
const LOOKBACK_DAYS = 30

/** Shortcut Weight: dùng lại hộp "Scale Weight" của trang Weight (ngày + cân nặng, Save) với form sạch mỗi lần mở (ngày hôm nay). */
export function WeightShortcutPage({ open, onOpenChange }: WeightShortcutPageProps) {
  const [today] = useState(() => todayIso())
  const [deleteDate, setDeleteDate] = useState<string | null>(null)
  const weights = useWeights(addDaysIso(today, -LOOKBACK_DAYS), today)
  const upsert = useUpsertWeight()
  const remove = useDeleteWeight()
  const form = useForm<LogWeightFormValues>({
    resolver: zodResolver(logWeightSchema),
    mode: 'onTouched',
    defaultValues: { logDate: today, weightKg: Number.NaN },
  })

  return (
    <>
      <LogWeightDialog
        open={open}
        onOpenChange={onOpenChange}
        form={form}
        entryDates={weights.data?.items.map((item) => item.logDate)}
        onDelete={(logDate) => {
          onOpenChange(false)
          setDeleteDate(logDate)
        }}
        isPending={upsert.isPending}
        error={upsert.error ? getFormErrorMessage(upsert.error) : null}
        onSubmit={(values) =>
          upsert.mutate(
            { logDate: values.logDate, weightKg: values.weightKg, notes: null },
            { onSuccess: () => onOpenChange(false) }
          )
        }
      />
      <ConfirmDialog
        open={deleteDate !== null}
        onOpenChange={(next) => !next && setDeleteDate(null)}
        title="Delete this weigh-in?"
        description={
          deleteDate
            ? `Delete the weigh-in on ${formatDate(deleteDate)}. Trend weight and expenditure are recalculated from that day on.`
            : ''
        }
        confirmLabel="Delete weigh-in"
        pendingLabel="Deleting..."
        isPending={remove.isPending}
        onConfirm={() =>
          deleteDate && remove.mutate(deleteDate, { onSuccess: () => setDeleteDate(null) })
        }
      />
    </>
  )
}
