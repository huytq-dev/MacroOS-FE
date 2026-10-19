'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { DateField } from '@/components/shared/DateField'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { PhotoAngle, ProgressPhotosData } from '../types/body-metrics.types'

export interface PhotoUpload {
  readonly consent: boolean
  readonly files: readonly { readonly angle: PhotoAngle; readonly file: File }[]
}

interface ProgressPhotosSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly date: string
  readonly onDateChange: (date: string) => void
  readonly data: ProgressPhotosData | null | undefined
  /** Đổi mỗi lần ảnh của ngày tải xong, để form dựng lại (URL ký có hạn nên luôn lấy bản mới). */
  readonly dataVersion: number
  readonly isLoading: boolean
  readonly isUploading: boolean
  readonly isDeleting: boolean
  readonly error: string | null
  readonly onUpload: (upload: PhotoUpload) => void
  readonly onDelete: () => void
}

const ANGLES: readonly PhotoAngle[] = ['Front', 'Side', 'Back']
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024

interface Picked {
  readonly file: File
  readonly url: string
}

type FormProps = Omit<
  ProgressPhotosSheetProps,
  'open' | 'onOpenChange' | 'dataVersion' | 'isLoading'
>

/** Một ô ảnh nét đứt: ảnh đã lưu (URL có chữ ký của BE) hoặc ảnh vừa chọn (xem trước), bấm để chọn / chụp. */
function PhotoTile({
  angle,
  saved,
  picked,
  onPick,
}: {
  readonly angle: PhotoAngle
  readonly saved: string | undefined
  readonly picked: Picked | undefined
  readonly onPick: (file: File) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const src = picked?.url ?? saved
  return (
    <li>
      <button
        type="button"
        aria-label={`${src ? 'Replace' : 'Add'} ${angle.toLowerCase()} photo`}
        onClick={() => input.current?.click()}
        className={cn(
          'focus-visible:ring-ring/50 relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 text-base transition-transform duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100',
          src ? 'border-transparent' : 'border-border text-muted-foreground border-dashed'
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL có chữ ký hết hạn / blob cục bộ, next/image không tối ưu được
          <img src={src} alt={`${angle} progress photo`} className="size-full object-cover" />
        ) : (
          <>
            <Camera aria-hidden="true" className="size-6" />
            {angle}
          </>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onPick(file)
          event.target.value = ''
        }}
      />
    </li>
  )
}

/** Form của một ngày; dựng lại (key) khi đổi ngày hoặc ảnh tải xong. Ảnh vừa chọn nằm ở state cục bộ tới khi Save. */
function PhotosForm({
  date,
  data,
  onDateChange,
  isUploading,
  isDeleting,
  error,
  onUpload,
  onDelete,
}: FormProps) {
  const [picked, setPicked] = useState<Partial<Record<PhotoAngle, Picked>>>({})
  const [consent, setConsent] = useState(false)
  const hasConsent = data?.hasConsent ?? false
  const hasPhotos = (data?.photos.length ?? 0) > 0
  const pickedCount = Object.keys(picked).length

  // Thu hồi URL blob khi rời form
  const urls = useRef<string[]>([])
  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    []
  )

  const [pickError, setPickError] = useState<string | null>(null)

  const pick = (angle: PhotoAngle, file: File) => {
    // BE chỉ nhận JPEG/PNG/WebP ≤ 10 MB (HEIC → 400): báo trước thay vì chờ upload thất bại
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPickError('Use a JPEG, PNG or WebP photo. HEIC isn’t supported.')
      return
    }
    if (file.size > MAX_BYTES) {
      setPickError('Photo is too large. The limit is 10 MB.')
      return
    }
    setPickError(null)
    const url = URL.createObjectURL(file)
    urls.current.push(url)
    setPicked((current) => ({ ...current, [angle]: { file, url } }))
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <DateField value={date} onValueChange={onDateChange} />
        </div>
        {hasPhotos && (
          <button
            type="button"
            aria-label="Delete this day's photos"
            disabled={isDeleting}
            onClick={onDelete}
            className="text-destructive focus-visible:ring-ring/50 active:bg-foreground/10 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <Trash2 aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>

      <div className="space-y-4 px-4 pt-5 pb-4">
        {pickError && <FormErrorAlert title="Can't use this photo" message={pickError} />}
        <FormErrorAlert title="Couldn't save photos" message={error} />
        <ul className="grid grid-cols-3 gap-2" aria-label="Progress photos">
          {ANGLES.map((angle) => (
            <PhotoTile
              key={angle}
              angle={angle}
              saved={data?.photos.find((photo) => photo.angle === angle)?.url}
              picked={picked[angle]}
              onPick={(file) => pick(angle, file)}
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
        <div className="bg-popover sticky bottom-0 -mx-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            className="bg-foreground text-background h-12 w-full rounded-lg text-base"
            disabled={pickedCount === 0 || (!hasConsent && !consent) || isUploading}
            aria-busy={isUploading}
            onClick={() =>
              onUpload({
                consent: hasConsent || consent,
                files: ANGLES.flatMap((angle) =>
                  picked[angle] ? [{ angle, file: picked[angle].file }] : []
                ),
              })
            }
          >
            {isUploading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </>
  )
}

/** Shortcut Photos: ba ô Front / Side / Back cho một ngày (chọn ảnh hoặc chụp, xem trước), Save tải lên; lần đầu cần đồng ý riêng tư. */
export function ProgressPhotosSheet({
  open,
  onOpenChange,
  dataVersion,
  isLoading,
  ...form
}: ProgressPhotosSheetProps) {
  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="Photos" showDone={false} tall>
      {isLoading ? (
        <div className="space-y-3 p-4" aria-busy="true">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="aspect-[3/2] rounded-xl" />
        </div>
      ) : (
        <PhotosForm key={`${form.date}-${dataVersion}`} {...form} />
      )}
    </SheetFrame>
  )
}
