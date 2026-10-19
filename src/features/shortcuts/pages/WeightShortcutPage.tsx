'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { LogWeightDialog } from '@/features/weight/components/WeightPage'
import { useUpsertWeight } from '@/features/weight/hooks/use-weights'
import {
  logWeightSchema,
  type LogWeightFormValues,
} from '@/features/weight/schemas/log-weight.schema'
import { todayIso } from '@/lib/date'

interface WeightShortcutPageProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Shortcut Weight: dùng lại hộp "Log weight" của trang Weight (ngày + cân nặng, Save) với form sạch mỗi lần mở (ngày hôm nay). */
export function WeightShortcutPage({ open, onOpenChange }: WeightShortcutPageProps) {
  const [today] = useState(() => todayIso())
  const upsert = useUpsertWeight()
  const form = useForm<LogWeightFormValues>({
    resolver: zodResolver(logWeightSchema),
    mode: 'onTouched',
    defaultValues: { logDate: today, weightKg: Number.NaN },
  })

  return (
    <LogWeightDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      isPending={upsert.isPending}
      error={upsert.error ? getFormErrorMessage(upsert.error) : null}
      onSubmit={(values) =>
        upsert.mutate(
          { logDate: values.logDate, weightKg: values.weightKg, notes: null },
          { onSuccess: () => onOpenChange(false) }
        )
      }
    />
  )
}
