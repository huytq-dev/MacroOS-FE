'use client'

import { useRef, useState } from 'react'
import { Loader2, PersonStanding, Trash2, X, type LucideProps } from 'lucide-react'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { SelectDateSheet } from '@/features/weight/components/BodyMetricPage/SelectDateSheet'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { ANGLES, photoOf } from '../progress-photos.utils'
import type { PhotoAngle, PhotoSession } from '../types/progress-photos.types'
import { CropPhotoScreen } from './CropPhotoScreen'

// Tư thế nghiêng (đi bộ) và sau lưng (dang tay) như MF; lucide không có hai dáng này nên vẽ path Material Icons (Apache 2.0).
const SideIcon = (props: LucideProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
  </svg>
)
const BackIcon = (props: LucideProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
  </svg>
)
const POSE_ICON = { Front: PersonStanding, Side: SideIcon, Back: BackIcon } as const
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 30 * 1024 * 1024

export interface PhotoSave {
  readonly date: string
  readonly consent: boolean
  readonly uploads: readonly { readonly angle: PhotoAngle; readonly file: Blob }[]
  readonly removals: readonly PhotoAngle[]
}

interface PhotoSessionSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Ngày đang thêm / sửa (yyyy-MM-dd). */
  readonly date: string
  readonly today: string
  readonly onDateChange: (date: string) => void
  /** Ảnh đã lưu của ngày này; thiếu = ngày mới (không có thùng rác). */
  readonly session: PhotoSession | undefined
  readonly hasConsent: boolean
  readonly isPending: boolean
  readonly error: string | null
  readonly onSave: (save: PhotoSave) => void
  readonly onDelete: () => void
}

interface Picked {
  readonly blob: Blob
  readonly url: string
}

/** Một ô vuông nét đứt của một góc: ảnh đã lưu hoặc vừa cắt (xem trước), bấm để chọn / chụp, ✕ để bỏ. */
function PoseSlot({
  angle,
  src,
  onChoose,
  onClear,
}: {
  readonly angle: PhotoAngle
  readonly src: string | undefined
  readonly onChoose: (file: File) => void
  readonly onClear: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const Icon = POSE_ICON[angle]
  return (
    <li className="min-w-0">
      <p className="mb-2 text-center text-base font-semibold">{angle}</p>
      <div className="relative">
        <button
          type="button"
          aria-label={`${src ? 'Replace' : 'Add'} ${angle.toLowerCase()} photo`}
          onClick={() => input.current?.click()}
          className={cn(
            'focus-visible:ring-ring/50 relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 transition-[transform,border-color] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100',
            src
              ? 'border-transparent'
              : 'bg-secondary text-muted-foreground border-dashed border-white/80'
          )}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL có chữ ký hết hạn / blob cục bộ, next/image không tối ưu được
            <img
              src={src}
              alt={`${angle} progress photo`}
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-300 size-full object-cover"
            />
          ) : (
            <Icon aria-hidden="true" className="size-8" />
          )}
        </button>
        {src && (
          <button
            type="button"
            aria-label={`Remove ${angle.toLowerCase()} photo`}
            onClick={onClear}
            className="bg-background/80 focus-visible:ring-ring/50 absolute top-1 right-1 flex size-8 items-center justify-center rounded-full transition-transform duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onChoose(file)
            event.target.value = ''
          }}
        />
      </div>
    </li>
  )
}

/**
 * Form của một ngày (dựng lại khi đổi ngày): ba ô Front / Side / Back; chọn ảnh thì mở màn Crop vuông, xong ảnh hiện trong ô. Ảnh đã
 * lưu bị bỏ thì ghi nhớ để xoá khi Save. Lần đầu tiên cần đồng ý lưu riêng tư.
 */
function SessionForm({
  date,
  session,
  hasConsent,
  isPending,
  error,
  onSave,
}: Pick<
  PhotoSessionSheetProps,
  'date' | 'session' | 'hasConsent' | 'isPending' | 'error' | 'onSave'
>) {
  const [picked, setPicked] = useState<Partial<Record<PhotoAngle, Picked>>>({})
  const [removed, setRemoved] = useState<readonly PhotoAngle[]>([])
  const [consent, setConsent] = useState(false)
  const [cropping, setCropping] = useState<{ angle: PhotoAngle; file: File } | null>(null)
  const [pickError, setPickError] = useState<string | null>(null)

  const choose = (angle: PhotoAngle, file: File) => {
    // BE chỉ nhận JPEG/PNG/WebP (HEIC → 400): báo trước thay vì chờ cắt / tải lên thất bại
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPickError('Use a JPEG, PNG or WebP photo. HEIC isn’t supported.')
      return
    }
    if (file.size > MAX_BYTES) {
      setPickError('Photo is too large. The limit is 30 MB.')
      return
    }
    setPickError(null)
    setCropping({ angle, file })
  }

  const srcOf = (angle: PhotoAngle) =>
    picked[angle]?.url ?? (removed.includes(angle) ? undefined : photoOf(session, angle)?.url)

  const clear = (angle: PhotoAngle) => {
    const current = picked[angle]
    if (current) URL.revokeObjectURL(current.url)
    setPicked((all) => Object.fromEntries(Object.entries(all).filter(([key]) => key !== angle)))
    if (photoOf(session, angle)) setRemoved((list) => [...new Set([...list, angle])])
  }

  const uploads = ANGLES.flatMap((angle) =>
    picked[angle] ? [{ angle, file: picked[angle].blob }] : []
  )
  const removals = removed.filter((angle) => !picked[angle])
  const dirty = uploads.length > 0 || removals.length > 0

  return (
    <>
      <div className="space-y-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {pickError && <FormErrorAlert title="Can't use this photo" message={pickError} />}
        <FormErrorAlert title="Couldn't save photos" message={error} />
        <ul className="grid grid-cols-3 gap-3" aria-label="Progress photos">
          {ANGLES.map((angle) => (
            <PoseSlot
              key={angle}
              angle={angle}
              src={srcOf(angle)}
              onChoose={(file) => choose(angle, file)}
              onClear={() => clear(angle)}
            />
          ))}
        </ul>
        {!hasConsent && (
          <label className="bg-secondary flex cursor-pointer items-start gap-3 rounded-xl px-4 py-3 text-base">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="accent-foreground mt-1 size-5 shrink-0"
            />
            <span>Only you can see your progress photos. I agree to store them privately.</span>
          </label>
        )}
        <Button
          className="bg-foreground text-background h-14 w-full rounded-lg text-base transition-transform duration-100 active:scale-[0.98] motion-reduce:active:scale-100"
          disabled={!dirty || (!hasConsent && !consent && uploads.length > 0) || isPending}
          aria-busy={isPending}
          onClick={() => onSave({ date, consent: hasConsent || consent, uploads, removals })}
        >
          {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          Save
        </Button>
      </div>

      {cropping && (
        <CropPhotoScreen
          file={cropping.file}
          onCancel={() => setCropping(null)}
          onConfirm={(blob) => {
            const { angle } = cropping
            const previous = picked[angle]
            if (previous) URL.revokeObjectURL(previous.url)
            setPicked((current) => ({
              ...current,
              [angle]: { blob, url: URL.createObjectURL(blob) },
            }))
            setRemoved((list) => list.filter((item) => item !== angle))
            setCropping(null)
          }}
        />
      )}
    </>
  )
}

/**
 * Bảng thêm / sửa ảnh một ngày (như MacroFactor): ✕, ngày ▾ mở "Select Date", phụ đề "Progress Photos", thùng rác khi ngày đã có ảnh
 * (xoá cả ngày), ba ô vuông nét đứt Front / Side / Back và nút Save.
 */
export function PhotoSessionSheet({
  open,
  onOpenChange,
  date,
  today,
  onDateChange,
  session,
  hasConsent,
  isPending,
  error,
  onSave,
  onDelete,
}: PhotoSessionSheetProps) {
  const [dateOpen, setDateOpen] = useState(false)
  return (
    <>
      <SheetFrame
        open={open}
        onOpenChange={onOpenChange}
        title={formatDate(date)}
        subtitle="Progress Photos"
        onTitleClick={() => setDateOpen(true)}
        showDone={false}
        headerAction={
          session && (
            <button
              type="button"
              aria-label="Delete this day's photos"
              onClick={onDelete}
              className="focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
            >
              <Trash2 aria-hidden="true" className="size-5" />
            </button>
          )
        }
      >
        <SessionForm
          key={date}
          date={date}
          session={session}
          hasConsent={hasConsent}
          isPending={isPending}
          error={error}
          onSave={onSave}
        />
      </SheetFrame>
      <SelectDateSheet
        key={date}
        open={dateOpen}
        onOpenChange={setDateOpen}
        value={date}
        today={today}
        onSelect={onDateChange}
      />
    </>
  )
}
