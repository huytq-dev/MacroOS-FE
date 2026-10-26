'use client'

import { useMemo, useRef, useState } from 'react'
import { Camera, Flashlight, FlashlightOff, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { FormErrorAlert } from '@/components/shared/FormErrorAlert'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { AiPlateEdits, IngredientEdit } from '../../ai-plate.utils'
import type { TileOptions } from '../../food-log-settings'
import { useCameraScanner } from '@/hooks/use-camera-scanner'
import { cn } from '@/lib/utils'
import type {
  AiConfirmIngredient,
  AiDish,
  AiIngredient,
  IngredientState,
  PlateItem,
  ResolvedIngredient,
} from '../../types/food-log.types'
import { AiPlateView } from './AiPlateView'
import { SlidingSwitch } from './SlidingSwitch'

type AiMode = 'snap' | 'describe'

const MODES: readonly { value: AiMode; label: string }[] = [
  { value: 'snap', label: 'Snap' },
  { value: 'describe', label: 'Describe' },
]

const MAX_PHOTOS = 3
const MAX_DESCRIPTION = 500

const ROUND =
  'bg-background/80 focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full backdrop-blur-sm transition-[background-color,transform] duration-200 active:scale-90 active:bg-background motion-reduce:active:scale-100 focus-visible:ring-1 focus-visible:outline-none'

export interface AiAnalyzeInput {
  readonly photos: File[]
  readonly description: string
}

interface AiPanelProps {
  /** Tab AI đang mở: camera chỉ bật khi đó và đang ở Snap, rời tab hoặc sang Describe thì tắt hẳn luồng. */
  readonly active: boolean
  /** Pha 1 đang chạy: form mờ đi, nút Analyze thành spinner. */
  readonly isAnalyzing: boolean
  readonly error: string | null
  /** Có `dishes` thì panel hiện kết quả AI Plate thay cho form. */
  readonly dishes: AiDish[] | null
  readonly states: Record<string, IngredientState>
  /** Ngày sẽ ghi (yyyy-MM-dd) cho thẻ Nutrition của kết quả. */
  readonly date: string
  readonly edits: AiPlateEdits
  readonly tileOptions: TileOptions
  readonly onSetGrams: (
    ingredientId: string,
    grams: number,
    serving?: IngredientEdit['serving']
  ) => void
  readonly onRemoveIngredient: (ingredientId: string) => void
  readonly onReplaceIngredient: (ingredientId: string, data: ResolvedIngredient) => void
  readonly onSetDishScale: (dishId: string, scale: number) => void
  readonly target?: ProgramWeek | null
  readonly onAnalyze: (input: AiAnalyzeInput) => void
  readonly onRetryIngredient: (ingredient: AiIngredient) => void
  readonly onStartOver: () => void
  readonly onLog: (items: PlateItem[], confirmations: AiConfirmIngredient[]) => void
}

function PhotoRow({ file, onRemove }: { readonly file: File; readonly onRemove: () => void }) {
  // Tạo URL xem trước lúc render; thu hồi khi ảnh đã vẽ xong (onLoad) chứ không ở cleanup của effect, vì StrictMode (dev) chạy
  // cleanup giữa chừng làm hỏng ảnh đang hiển thị. Ảnh đã giải mã nên thu hồi URL không làm mất hình.
  const url = useMemo(() => URL.createObjectURL(file), [file])
  return (
    <li className="border-border flex items-center gap-3 rounded-xl border p-2">
      <div className="bg-secondary size-14 shrink-0 overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL cục bộ, next/image không tối ưu được */}
        <img
          src={url}
          alt=""
          onLoad={() => URL.revokeObjectURL(url)}
          className="size-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base">{file.name}</p>
        <p className="text-mf-tile-carbs text-sm">✓ Upload successful</p>
      </div>
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="bg-secondary focus-visible:ring-ring/50 active:bg-foreground/20 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        <Trash2 aria-hidden="true" fill="currentColor" className="size-5" />
      </button>
    </li>
  )
}

/**
 * Tab AI (kiểu MacroFactor): Snap = camera sau toàn khung, chụp hoặc tải ảnh; Describe = danh sách ảnh (tối đa 3) và mô tả chữ
 * (tối đa 500 ký tự). Chụp/tải ảnh ở Snap thì tự sang Describe. Bấm Analyze: form mờ + spinner, xong thì hiện AI Plate; lỗi thì
 * báo ngay trên form và nút đổi thành "Try again" (ảnh và mô tả giữ nguyên).
 */
export function AiPanel({
  active,
  isAnalyzing,
  error,
  dishes,
  states,
  date,
  edits,
  tileOptions,
  onSetGrams,
  onRemoveIngredient,
  onReplaceIngredient,
  onSetDishScale,
  target,
  onAnalyze,
  onRetryIngredient,
  onStartOver,
  onLog,
}: AiPanelProps) {
  const [mode, setMode] = useState<AiMode>('snap')
  const [photos, setPhotos] = useState<File[]>([])
  const [description, setDescription] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const {
    videoRef,
    status: cameraStatus,
    torchOn,
    torchSupported,
    toggleTorch,
  } = useCameraScanner({
    active: active && mode === 'snap' && !dishes,
    detect: false,
    onCode: () => undefined,
  })
  const unavailable = cameraStatus === 'denied' || cameraStatus === 'unsupported'
  const full = photos.length >= MAX_PHOTOS
  const canAnalyze = photos.length > 0 || description.trim().length > 0

  const addPhotos = (files: File[]) => {
    if (files.length === 0) return
    const room = MAX_PHOTOS - photos.length
    if (files.length > room) toast(`You can add up to ${MAX_PHOTOS} photos`)
    setPhotos([...photos, ...files.slice(0, room)])
    setMode('describe')
  }

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) addPhotos([new File([blob], `meal-${Date.now()}.jpg`, { type: 'image/jpeg' })])
      },
      'image/jpeg',
      0.9
    )
  }

  const fileInputElement = (
    <input
      ref={fileInput}
      type="file"
      accept="image/*"
      multiple
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => {
        addPhotos(Array.from(event.target.files ?? []))
        event.target.value = ''
      }}
    />
  )

  if (dishes) {
    return (
      <AiPlateView
        date={date}
        dishes={dishes}
        states={states}
        edits={edits}
        target={target}
        tileOptions={tileOptions}
        onSetGrams={onSetGrams}
        onRemoveIngredient={onRemoveIngredient}
        onReplaceIngredient={onReplaceIngredient}
        onSetDishScale={onSetDishScale}
        onRetry={onRetryIngredient}
        onStartOver={onStartOver}
        onLog={onLog}
      />
    )
  }

  if (mode === 'describe') {
    return (
      <div className="flex h-full min-h-[24rem] flex-col">
        <div
          inert={isAnalyzing}
          className={cn(
            'flex min-h-0 flex-1 flex-col transition-opacity duration-300 motion-reduce:transition-none',
            isAnalyzing && 'opacity-40'
          )}
        >
          <div className="mx-3 mt-3">
            <SlidingSwitch
              options={MODES}
              value={mode}
              onChange={setMode}
              label="AI input mode"
              className="bg-secondary"
            />
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5">
            <section>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-base font-medium">Photos</h3>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {photos.length}/{MAX_PHOTOS}
                </span>
              </div>
              {photos.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {photos.map((file, index) => (
                    <PhotoRow
                      key={`${file.name}-${file.lastModified}-${index}`}
                      file={file}
                      onRemove={() => setPhotos(photos.filter((_, position) => position !== index))}
                    />
                  ))}
                </ul>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={full}
                  onClick={() => setMode('snap')}
                  className="bg-secondary focus-visible:ring-ring/50 enabled:active:bg-foreground/20 flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-base font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-40"
                >
                  <Camera aria-hidden="true" className="size-5" />
                  Capture
                </button>
                <button
                  type="button"
                  aria-label="Upload photos"
                  disabled={full}
                  onClick={() => fileInput.current?.click()}
                  className="bg-secondary focus-visible:ring-ring/50 enabled:active:bg-foreground/20 flex size-12 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-40"
                >
                  <Upload aria-hidden="true" className="size-5" />
                </button>
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-baseline justify-between">
                <label htmlFor="ai-description" className="text-base font-medium">
                  Description
                </label>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {description.length}/{MAX_DESCRIPTION}
                </span>
              </div>
              <textarea
                id="ai-description"
                value={description}
                maxLength={MAX_DESCRIPTION}
                placeholder="Describe your meal"
                onChange={(event) => setDescription(event.target.value)}
                className="bg-secondary placeholder:text-muted-foreground focus-visible:ring-ring/50 h-36 w-full resize-none rounded-lg px-4 py-3 text-base focus-visible:ring-1 focus-visible:outline-none"
              />
            </section>
          </div>
        </div>

        <div className="space-y-2 px-4 pt-2 pb-4">
          <FormErrorAlert title="Couldn't analyze your meal" message={error} />
          <button
            type="button"
            disabled={!canAnalyze || isAnalyzing}
            aria-busy={isAnalyzing}
            onClick={() => onAnalyze({ photos, description: description.trim() })}
            className={cn(
              'focus-visible:ring-ring/50 flex h-12 w-full items-center justify-center rounded-lg text-base font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-40',
              isAnalyzing
                ? 'bg-secondary text-foreground disabled:opacity-100'
                : 'bg-foreground text-background'
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />
                <span className="sr-only">Analyzing</span>
              </>
            ) : error ? (
              'Try again'
            ) : (
              'Analyze'
            )}
          </button>
        </div>
        {fileInputElement}
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[24rem] overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        aria-hidden="true"
        className={cn(
          'absolute inset-0 size-full object-cover transition-opacity duration-300',
          cameraStatus === 'ready' ? 'opacity-100' : 'opacity-0'
        )}
      />

      {unavailable && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
          <p className="text-base font-medium">
            {cameraStatus === 'denied' ? 'Camera access is blocked' : 'Camera is not available'}
          </p>
          <p className="text-muted-foreground text-sm">
            {cameraStatus === 'denied'
              ? 'Allow camera access in your browser settings, or upload a photo instead.'
              : 'The camera needs a secure (HTTPS) connection. You can upload a photo instead.'}
          </p>
        </div>
      )}

      <div className="absolute inset-x-3 top-3 flex items-start justify-between">
        <SlidingSwitch
          options={MODES}
          value={mode}
          onChange={setMode}
          label="AI input mode"
          className="bg-background/80 backdrop-blur-sm"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Upload photos"
            disabled={full}
            onClick={() => fileInput.current?.click()}
            className={cn(ROUND, full && 'opacity-60')}
          >
            <Upload aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label={torchOn ? 'Turn flash off' : 'Turn flash on'}
            aria-pressed={torchOn}
            disabled={!torchSupported}
            onClick={toggleTorch}
            className={cn(ROUND, !torchSupported && 'opacity-60')}
          >
            {torchOn ? (
              <Flashlight aria-hidden="true" className="size-5" />
            ) : (
              <FlashlightOff aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        aria-label="Take photo"
        disabled={full || cameraStatus !== 'ready'}
        onClick={capture}
        className="focus-visible:ring-ring/50 absolute bottom-6 left-1/2 flex size-[4.5rem] -translate-x-1/2 items-center justify-center rounded-full border-4 border-white focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
      >
        <span className="size-14 rounded-full bg-white transition-transform active:scale-90" />
      </button>
      {fileInputElement}
    </div>
  )
}
