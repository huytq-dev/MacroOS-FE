'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Camera, Columns2, Images, Plus, type LucideIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { IconButton } from '@/components/shared/IconButton'
import { Skeleton } from '@/components/ui/skeleton'
import { routePath } from '@/config/route-path'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { useSheet } from '@/hooks/use-sheet'
import { todayIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PhotoSessionSheet, type PhotoSave } from '../components/PhotoSessionSheet'
import { SessionRow } from '../components/SessionRow'
import {
  useDeletePhotoSession,
  useProgressPhotoSessions,
  useSavePhotoSession,
} from '../hooks/use-progress-photos'
import { groupByMonth } from '../progress-photos.utils'

/** Hai nút dưới tiêu đề chia đôi một hàng, co lại và cắt chữ thay vì đẩy cột rộng ra (không tràn ngang ở 320px). */
function Pill({
  href,
  icon: Icon,
  children,
}: {
  readonly href: string | null
  readonly icon: LucideIcon
  readonly children: string
}) {
  const classes =
    "focus-visible:ring-ring/50 bg-background relative flex h-9 min-w-0 flex-auto items-center justify-center gap-1.5 rounded-full px-3 text-[13.5px] transition-[background-color,opacity,transform] duration-100 before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] focus-visible:ring-1 focus-visible:outline-none"
  const body = (
    <>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{children}</span>
    </>
  )
  return href ? (
    <Link href={href} className={cn(classes, 'active:scale-95 motion-reduce:active:scale-100')}>
      {body}
    </Link>
  ) : (
    <span aria-disabled="true" className={cn(classes, 'opacity-50')}>
      {body}
    </span>
  )
}

/**
 * Trang Progress Photos (như MacroFactor): tiêu đề với nút + (thêm ngày), hai nút Open Gallery / Compare Before & After (tắt khi chưa đủ
 * ảnh), rồi các ngày có ảnh nhóm theo tháng. Bút chì mở sheet sửa, chạm hàng mở màn xem. Ảnh lưu riêng tư, URL có chữ ký hết hạn ngắn.
 */
export function ProgressPhotosPage() {
  const query = useProgressPhotoSessions()
  const save = useSavePhotoSession()
  const remove = useDeletePhotoSession()
  const sheet = useSheet<true>()
  const confirm = useSheet<true>()
  const [target, setTarget] = useState({ date: '', today: '' })

  const sessions = query.data?.sessions ?? []
  const groups = groupByMonth(sessions)
  const current = sessions.find((session) => session.date === target.date)
  const canGallery = sessions.length > 0
  const canCompare = sessions.length > 1

  const open = (date?: string) => {
    const today = todayIso()
    setTarget({ date: date ?? today, today })
    save.reset()
    sheet.show(true)
  }
  const onSave = (payload: PhotoSave) => save.mutate(payload, { onSuccess: () => sheet.hide() })

  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-5 pb-8">
      <div className="bg-card -mx-4 min-w-0 space-y-3 px-4 pb-3">
        <SubPageHeader
          title="Progress Photos"
          action={
            <IconButton
              icon={Plus}
              label="Add progress photos"
              className="size-11"
              onClick={() => open()}
            />
          }
        />

        <div className="flex min-w-0 gap-2">
          <Pill href={canGallery ? routePath.progressPhotosGallery : null} icon={Images}>
            Open Gallery
          </Pill>
          <Pill href={canCompare ? routePath.progressPhotosCompare : null} icon={Columns2}>
            Compare Before &amp; After
          </Pill>
        </div>
      </div>

      {query.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          variant="inline"
          onRetry={() => void query.refetch()}
          isRetrying={query.isRefetching}
        />
      ) : groups.length === 0 ? (
        <div className="text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-500 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Camera aria-hidden="true" className="size-10" />
          <p className="text-foreground text-lg font-medium">No progress photos yet</p>
          <p className="text-base">Tap + to add front, side and back photos for a day.</p>
        </div>
      ) : (
        groups.map((group, index) => (
          <section
            key={group.key}
            aria-labelledby={`photos-${group.key}`}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-400 space-y-3 [animation-fill-mode:backwards]"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <h2 id={`photos-${group.key}`} className="text-xl font-bold">
              {group.label}
            </h2>
            <ul className="space-y-3">
              {group.sessions.map((session) => (
                <li key={session.date}>
                  <SessionRow session={session} onEdit={(item) => open(item.date)} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {sheet.value && (
        <PhotoSessionSheet
          key={sheet.id}
          open={sheet.open}
          onOpenChange={sheet.onOpenChange}
          date={target.date}
          today={target.today}
          onDateChange={(date) => setTarget((previous) => ({ ...previous, date }))}
          session={current}
          hasConsent={query.data?.hasConsent ?? false}
          isPending={save.isPending}
          error={save.error ? getFormErrorMessage(save.error) : null}
          onSave={onSave}
          onDelete={() => {
            remove.reset()
            confirm.show(true)
          }}
        />
      )}
      {confirm.value && (
        <ConfirmDialog
          key={confirm.id}
          open={confirm.open}
          onOpenChange={confirm.onOpenChange}
          title="Delete these photos?"
          description="All progress photos from this day will be permanently deleted. This can't be undone."
          confirmLabel="Delete"
          pendingLabel="Deleting..."
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate(target.date, {
              onSuccess: () => {
                confirm.hide()
                sheet.hide()
              },
            })
          }
        />
      )}
    </div>
  )
}
