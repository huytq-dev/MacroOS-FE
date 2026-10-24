'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { routePath } from '@/config/route-path'
import { goBack } from '@/lib/back-target'
import { Camera, ChevronLeft, ChevronRight, Pencil, Rows2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { useUnits } from '@/features/users/hooks/use-units'
import { useSheet } from '@/hooks/use-sheet'
import { formatDate, todayIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PhotoSessionSheet, type PhotoSave } from '../components/PhotoSessionSheet'
import {
  useDeletePhotoSession,
  useProgressPhotoSessions,
  useSavePhotoSession,
} from '../hooks/use-progress-photos'
import { dominantColor } from '../image.utils'
import { ANGLES, kgLabel, photoOf } from '../progress-photos.utils'
import type { PhotoAngle, PhotoSession } from '../types/progress-photos.types'

const ANGLE_OPTIONS = ANGLES.map((angle) => ({ value: angle, label: angle }))
const ROUND =
  'focus-visible:ring-ring/50 flex size-12 items-center justify-center rounded-full text-white transition-[background-color,transform,opacity] duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-90 disabled:opacity-30 motion-reduce:active:scale-100'
const SWIPE_PX = 60

const parseAngle = (value: string | null): PhotoAngle =>
  ANGLES.find((angle) => angle === value) ?? 'Front'

/** Vị trí ngày `date` trong dòng thời gian (cũ → mới); không có ngày đó thì lấy ngày gần nhất không muộn hơn, hoặc ngày đầu. */
function indexOfDate(timeline: readonly PhotoSession[], date: string | null) {
  if (timeline.length === 0) return -1
  if (!date) return timeline.length - 1
  const exact = timeline.findIndex((session) => session.date === date)
  if (exact >= 0) return exact
  const earlier = timeline.filter((session) => session.date <= date).length - 1
  return earlier >= 0 ? earlier : 0
}

async function sharePhoto(url: string, name: string) {
  const blob = await (await fetch(url)).blob()
  const file = new File([blob], `${name}.jpg`, { type: blob.type || 'image/jpeg' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Progress photo' })
    return
  }
  // Không có Web Share (máy tính): tải ảnh về
  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = file.name
  link.click()
  URL.revokeObjectURL(link.href)
}

/** Công tắc Front | Side | Back của màn xem (như MacroFactor): nền trong mờ, ô đang chọn là viên sáng mờ trượt 300ms, chữ trắng. */
function AngleTabs({
  value,
  onChange,
}: {
  readonly value: PhotoAngle
  readonly onChange: (angle: PhotoAngle) => void
}) {
  const index = ANGLES.indexOf(value)
  return (
    <div
      role="radiogroup"
      aria-label="Photo angle"
      className="relative grid w-full max-w-72 grid-cols-3 rounded-full bg-white/10 p-1"
    >
      <span
        aria-hidden="true"
        style={{ transform: `translateX(${index * 100}%)` }}
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-white/30 transition-transform duration-300 ease-out motion-reduce:transition-none"
      />
      {ANGLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'focus-visible:ring-ring/50 relative z-10 min-h-11 rounded-full px-3 text-base transition-[color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100',
            option.value === value ? 'font-semibold text-white' : 'text-white/80'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Gallery() {
  const router = useRouter()
  const { weight } = useUnits()
  const params = useSearchParams()
  const query = useProgressPhotoSessions()
  const save = useSavePhotoSession()
  const remove = useDeletePhotoSession()
  const sheet = useSheet<true>()
  const confirm = useSheet<true>()
  const [angle, setAngle] = useState<PhotoAngle>(() => parseAngle(params.get('angle')))
  const [date, setDate] = useState<string | null>(() => params.get('date'))
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null)
  const [compact, setCompact] = useState(false)
  const [colors, setColors] = useState<Record<string, string>>({})
  const [dragX, setDragX] = useState(0)
  const [editDate, setEditDate] = useState({ date: '', today: '' })
  const dragStart = useRef<number | null>(null)
  const strip = useRef<(HTMLButtonElement | null)[]>([])

  const sessions = query.data?.sessions ?? []
  // Cũ → mới, chỉ những ngày có ảnh của góc đang xem
  const timeline = sessions.filter((session) => photoOf(session, angle)).reverse()
  const index = indexOfDate(timeline, date)
  const session = timeline[index]
  const photo = photoOf(session, angle)
  const tint = photo ? colors[photo.id] : undefined

  useEffect(() => {
    strip.current[index]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [index, timeline.length])

  const go = (delta: number) => {
    const next = timeline[index + delta]
    if (!next) return
    setDirection(delta > 0 ? 'next' : 'prev')
    setDate(next.date)
  }
  const jump = (target: number) => {
    const next = timeline[target]
    if (!next || target === index) return
    setDirection(target > index ? 'next' : 'prev')
    setDate(next.date)
  }

  const onPointerDown = (event: React.PointerEvent) => {
    dragStart.current = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: React.PointerEvent) => {
    if (dragStart.current !== null) setDragX(event.clientX - dragStart.current)
  }
  const onPointerUp = () => {
    if (dragStart.current === null) return
    // Vuốt phải về ngày cũ hơn, vuốt trái tới ngày mới hơn
    if (dragX > SWIPE_PX) go(-1)
    else if (dragX < -SWIPE_PX) go(1)
    dragStart.current = null
    setDragX(0)
  }

  const onLoaded = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!photo) return
    const rgb = dominantColor(event.currentTarget)
    if (rgb) {
      const id = photo.id
      setColors((current) => ({ ...current, [id]: `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})` }))
    }
  }

  const onShare = () => {
    if (!photo || !session) return
    sharePhoto(photo.url, `progress-${session.date}-${angle.toLowerCase()}`).catch((error) => {
      // Người dùng đóng bảng chia sẻ không phải lỗi
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error("Couldn't share this photo")
    })
  }

  const edit = (target?: string) => {
    const today = todayIso()
    setEditDate({ date: target ?? today, today })
    save.reset()
    sheet.show(true)
  }
  const onSave = (payload: PhotoSave) => save.mutate(payload, { onSuccess: () => sheet.hide() })
  const editing = sessions.find((item) => item.date === editDate.date)

  return (
    <div
      className="flex min-h-dvh flex-col text-white transition-colors duration-700 ease-out motion-reduce:transition-none"
      style={{
        backgroundColor: tint ? `color-mix(in srgb, ${tint} 72%, black)` : 'var(--background)',
      }}
    >
      <header className="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Back"
          onClick={() => goBack(router, routePath.progressPhotosGallery)}
          className={cn(ROUND, 'size-11 shrink-0')}
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
        <div className="flex flex-1 justify-center">
          <AngleTabs
            value={angle}
            onChange={(next) => {
              setDirection(null)
              setAngle(next)
            }}
          />
        </div>
        <span className="size-11 shrink-0" aria-hidden="true" />
      </header>

      {query.isPending ? (
        <div className="space-y-4 p-6" aria-busy="true">
          <Skeleton className="mx-auto h-7 w-40" />
          <Skeleton className="aspect-square w-full rounded-3xl" />
        </div>
      ) : !session || !photo ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <Camera aria-hidden="true" className="size-10 opacity-70" />
          <p className="text-lg font-medium">No {angle.toLowerCase()} photos yet</p>
          <button
            type="button"
            onClick={() => edit()}
            className="bg-foreground text-background min-h-11 rounded-full px-6 text-base transition-transform duration-100 active:scale-95 motion-reduce:active:scale-100"
          >
            Add photos
          </button>
        </div>
      ) : (
        <>
          <p
            key={session.date}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 pt-5 text-center text-2xl"
          >
            {formatDate(session.date)}
          </p>

          <div
            className="touch-pan-y px-6 pt-4"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              style={{
                transform: dragX ? `translateX(${dragX * 0.6}px)` : undefined,
                transition: dragX ? 'none' : undefined,
              }}
              className="mx-auto max-w-md transition-transform duration-200"
            >
              {/* key theo ảnh: đổi ngày / góc thì ảnh mới trượt vào từ phía vuốt */}
              {/* eslint-disable-next-line @next/next/no-img-element -- URL có chữ ký hết hạn, next/image không tối ưu được */}
              <img
                key={photo.id}
                src={photo.url}
                alt={`${angle} progress photo from ${formatDate(session.date)}`}
                draggable={false}
                onLoad={onLoaded}
                className={cn(
                  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 aspect-square w-full touch-pan-y rounded-3xl object-cover select-none',
                  direction === 'next' && 'motion-safe:slide-in-from-right-8',
                  direction === 'prev' && 'motion-safe:slide-in-from-left-8',
                  direction === null && 'motion-safe:zoom-in-95'
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
              compact ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
            )}
          >
            <div className="min-h-0 overflow-hidden" inert={compact}>
              <p
                key={`w-${session.date}`}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 space-y-1 px-6 pt-5 text-center text-base"
              >
                <span className="block">
                  Trend Weight:{' '}
                  <b className="font-semibold">{kgLabel(session.trendWeightKg, weight)}</b>
                </span>
                <span className="block">
                  Scale Weight:{' '}
                  <b className="font-semibold">{kgLabel(session.scaleWeightKg, weight)}</b>
                </span>
              </p>
            </div>
          </div>
        </>
      )}

      <div className="mt-auto">
        {session && photo && (
          <div
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
              compact ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
            )}
          >
            <div className="min-h-0 overflow-hidden" inert={compact}>
              <ul
                aria-label="Photo dates"
                className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pt-6 pb-1 [&::-webkit-scrollbar]:hidden"
              >
                {timeline.map((item, position) => {
                  const thumb = photoOf(item, angle)
                  const active = position === index
                  return (
                    <li key={item.date} className="relative shrink-0 pt-3">
                      {active && (
                        <span
                          aria-hidden="true"
                          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 absolute top-0 left-1/2 -translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent border-t-white"
                        />
                      )}
                      <button
                        type="button"
                        ref={(node) => {
                          strip.current[position] = node
                        }}
                        aria-label={formatDate(item.date)}
                        aria-current={active || undefined}
                        onClick={() => jump(position)}
                        className={cn(
                          'focus-visible:ring-ring/50 block size-16 overflow-hidden rounded-md transition-[transform,opacity] duration-200 focus-visible:ring-1 focus-visible:outline-none',
                          active ? 'scale-100' : 'scale-90 opacity-60'
                        )}
                      >
                        {thumb && (
                          // eslint-disable-next-line @next/next/no-img-element -- URL có chữ ký hết hạn, next/image không tối ưu được
                          <img
                            src={thumb.url}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            aria-label="Share photo"
            disabled={!photo}
            onClick={onShare}
            className={ROUND}
          >
            <Share2 aria-hidden="true" className="size-6" />
          </button>
          <button
            type="button"
            aria-label="Previous date"
            disabled={index <= 0}
            onClick={() => go(-1)}
            className={ROUND}
          >
            <ChevronLeft aria-hidden="true" className="size-7" />
          </button>
          <button
            type="button"
            aria-label={compact ? 'Show details' : 'Hide details'}
            aria-pressed={compact}
            disabled={!photo}
            onClick={() => setCompact((value) => !value)}
            className={cn(ROUND, 'size-14 bg-white/15')}
          >
            <Rows2 aria-hidden="true" className="size-7" />
          </button>
          <button
            type="button"
            aria-label="Next date"
            disabled={index < 0 || index >= timeline.length - 1}
            onClick={() => go(1)}
            className={ROUND}
          >
            <ChevronRight aria-hidden="true" className="size-7" />
          </button>
          <button
            type="button"
            aria-label="Edit photos"
            disabled={!session}
            onClick={() => session && edit(session.date)}
            className={ROUND}
          >
            <Pencil aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>

      {sheet.value && (
        <PhotoSessionSheet
          key={sheet.id}
          open={sheet.open}
          onOpenChange={sheet.onOpenChange}
          date={editDate.date}
          today={editDate.today}
          onDateChange={(next) => setEditDate((previous) => ({ ...previous, date: next }))}
          session={editing}
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
            remove.mutate(editDate.date, {
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

/** Màn xem ảnh tiến độ toàn màn hình (không thanh tab): `?date=&angle=` mở đúng ngày / góc. */
export function GalleryPage() {
  return (
    <Suspense fallback={null}>
      <Gallery />
    </Suspense>
  )
}
