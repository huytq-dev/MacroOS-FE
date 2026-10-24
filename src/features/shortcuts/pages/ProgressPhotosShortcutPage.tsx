'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const query = useProgressPhotos(date, open)
  const upload = useUploadPhotos()
  const remove = useDeletePhotos()
  const close = () => onOpenChange(false)
  const mutationError = upload.error ?? remove.error

  return (
    <>
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
        onDelete={() => {
          remove.reset()
          setConfirmOpen(true)
        }}
      />
      {/* Xoá cả ngày ảnh không hoàn tác được: hỏi lại như trang Progress Photos */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete these photos?"
        description="All progress photos from this day will be permanently deleted. This can't be undone."
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        isPending={remove.isPending}
        onConfirm={() =>
          remove.mutate(date, {
            onSuccess: () => {
              setConfirmOpen(false)
              close()
            },
          })
        }
      />
    </>
  )
}
