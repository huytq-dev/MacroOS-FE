'use client'

import { useState } from 'react'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { todayIso } from '@/lib/date'
import { ProgressPhotosSheet, type PhotoUpload } from '../components/ProgressPhotosSheet'
import { useDeletePhotos, useProgressPhotos, useUploadPhotos } from '../hooks/use-body-metrics'

interface ProgressPhotosShortcutPageProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Shortcut Photos: ảnh tiến độ của một ngày. Chỉ tải khi sheet mở; URL ảnh có chữ ký hết hạn ~15 phút nên không cache lâu. */
export function ProgressPhotosShortcutPage({
  open,
  onOpenChange,
}: ProgressPhotosShortcutPageProps) {
  const [date, setDate] = useState(() => todayIso())
  const query = useProgressPhotos(date, open)
  const upload = useUploadPhotos()
  const remove = useDeletePhotos()
  const close = () => onOpenChange(false)
  const mutationError = upload.error ?? remove.error

  return (
    <ProgressPhotosSheet
      open={open}
      onOpenChange={onOpenChange}
      date={date}
      onDateChange={setDate}
      data={query.data}
      dataVersion={query.dataUpdatedAt}
      isLoading={query.isLoading}
      isUploading={upload.isPending}
      isDeleting={remove.isPending}
      error={mutationError ? getFormErrorMessage(mutationError) : null}
      onUpload={(photos: PhotoUpload) => upload.mutate({ date, ...photos }, { onSuccess: close })}
      onDelete={() => remove.mutate(date, { onSuccess: close })}
    />
  )
}
