'use client'

import { useState } from 'react'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { todayIso } from '@/lib/date'
import { FullBodySheet } from '../components/FullBodySheet'
import { useDeleteFullBody, useFullBody, useSaveFullBody } from '../hooks/use-body-metrics'
import { fullBodySchema } from '../schemas/full-body.schema'
import type { FullBodyRequest } from '../types/body-metrics.types'

interface FullBodyShortcutPageProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Shortcut Metrics: số đo cơ thể của một ngày. Chỉ tải khi sheet mở; kiểm tra khoảng giá trị bằng Zod trước khi gửi (khớp validator BE). */
export function FullBodyShortcutPage({ open, onOpenChange }: FullBodyShortcutPageProps) {
  const [date, setDate] = useState(() => todayIso())
  const [validationError, setValidationError] = useState<string | null>(null)
  const query = useFullBody(date, open)
  const save = useSaveFullBody()
  const remove = useDeleteFullBody()
  const close = () => onOpenChange(false)

  const onSave = (payload: FullBodyRequest) => {
    const result = fullBodySchema.safeParse(payload)
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Check your measurements')
      return
    }
    setValidationError(null)
    save.mutate(payload, { onSuccess: close })
  }

  const mutationError = save.error ?? remove.error
  return (
    <FullBodySheet
      open={open}
      onOpenChange={onOpenChange}
      date={date}
      onDateChange={(next) => {
        setValidationError(null)
        setDate(next)
      }}
      data={query.data}
      dataVersion={query.dataUpdatedAt}
      isLoading={query.isLoading}
      isSaving={save.isPending}
      isDeleting={remove.isPending}
      error={validationError ?? (mutationError ? getFormErrorMessage(mutationError) : null)}
      onSave={onSave}
      onDelete={() => remove.mutate(date, { onSuccess: close })}
    />
  )
}
