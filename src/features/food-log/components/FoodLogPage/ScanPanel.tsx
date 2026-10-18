'use client'

import { useRef, useState } from 'react'
import { Flashlight, FlashlightOff, Keyboard, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useCameraScanner } from '@/hooks/use-camera-scanner'
import { cn } from '@/lib/utils'
import { SlidingSwitch } from './SlidingSwitch'

type ScanMode = 'barcode' | 'label'

const MODES: readonly { value: ScanMode; label: string }[] = [
  { value: 'barcode', label: 'Barcode' },
  { value: 'label', label: 'Label' },
]

const ROUND =
  'bg-background/80 focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full backdrop-blur-sm transition-[background-color,transform] duration-200 active:scale-90 active:bg-background motion-reduce:active:scale-100 focus-visible:ring-1 focus-visible:outline-none'

interface ScanPanelProps {
  /** Tab Scan đang mở: chỉ khi đó mới bật camera, rời tab thì tắt. */
  readonly active: boolean
  /** Đang tra mã vạch (tạm dừng đọc thêm). */
  readonly isLookingUp: boolean
  readonly error: string | null
  /** Có mã vạch (quét được hoặc nhập tay) → cha tra cứu. */
  readonly onCode: (code: string) => void
  readonly onManual: () => void
}

/**
 * Tab Scan (kiểu MacroFactor): ảnh camera sau toàn khung, thanh Barcode / Label trượt ở góc trên trái, nút bàn phím (nhập mã tay) và
 * đèn flash ở góc phải. Barcode: khung ngắm, tự đọc mã khi trình duyệt hỗ trợ `BarcodeDetector` (nếu không thì nhập tay). Label:
 * nút tải ảnh và nút chụp (đọc nhãn dinh dưỡng bằng AI chưa có nên chỉ báo "sắp có").
 */
export function ScanPanel({ active, isLookingUp, error, onCode, onManual }: ScanPanelProps) {
  const [mode, setMode] = useState<ScanMode>('barcode')
  const fileInput = useRef<HTMLInputElement>(null)
  const camera = useCameraScanner({
    active,
    detect: mode === 'barcode' && !isLookingUp,
    onCode,
  })
  const comingSoon = () => toast('Label scanning is coming soon')
  const unavailable = camera.status === 'denied' || camera.status === 'unsupported'

  return (
    <div className="relative h-full min-h-[24rem] overflow-hidden bg-black">
      <video
        ref={camera.videoRef}
        playsInline
        muted
        aria-hidden="true"
        className={cn(
          'absolute inset-0 size-full object-cover transition-opacity duration-300',
          camera.status === 'ready' ? 'opacity-100' : 'opacity-0'
        )}
      />

      {unavailable && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
          <p className="text-base font-medium">
            {camera.status === 'denied' ? 'Camera access is blocked' : 'Camera is not available'}
          </p>
          <p className="text-muted-foreground text-sm">
            {camera.status === 'denied'
              ? 'Allow camera access in your browser settings, or enter the barcode manually.'
              : 'The camera needs a secure (HTTPS) connection. You can enter the barcode manually.'}
          </p>
        </div>
      )}

      <div className="absolute inset-x-3 top-3 flex items-start justify-between">
        <SlidingSwitch
          options={MODES}
          value={mode}
          onChange={setMode}
          label="Scan mode"
          className="bg-background/80 backdrop-blur-sm"
        />
        <div className="flex items-center gap-3">
          {mode === 'barcode' ? (
            <button
              type="button"
              aria-label="Enter barcode manually"
              onClick={onManual}
              className={ROUND}
            >
              <Keyboard aria-hidden="true" className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Upload a label photo"
              onClick={() => fileInput.current?.click()}
              className={ROUND}
            >
              <Upload aria-hidden="true" className="size-5" />
            </button>
          )}
          <button
            type="button"
            aria-label={camera.torchOn ? 'Turn flash off' : 'Turn flash on'}
            aria-pressed={camera.torchOn}
            disabled={!camera.torchSupported}
            onClick={camera.toggleTorch}
            className={cn(ROUND, !camera.torchSupported && 'opacity-60')}
          >
            {camera.torchOn ? (
              <Flashlight aria-hidden="true" className="size-5" />
            ) : (
              <FlashlightOff aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {mode === 'barcode' && !unavailable && (
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 h-1/3 w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/60"
        />
      )}

      {mode === 'label' && (
        <button
          type="button"
          aria-label="Capture nutrition label"
          onClick={comingSoon}
          className="focus-visible:ring-ring/50 absolute bottom-6 left-1/2 flex size-[4.5rem] -translate-x-1/2 items-center justify-center rounded-full border-4 border-white focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="size-14 rounded-full bg-white transition-transform active:scale-90" />
        </button>
      )}

      {mode === 'barcode' &&
        !unavailable &&
        !camera.detectorSupported &&
        camera.status === 'ready' && (
          <p className="bg-background/80 absolute inset-x-6 bottom-6 rounded-xl px-4 py-3 text-center text-sm backdrop-blur-sm">
            Automatic barcode reading is not supported in this browser. Tap the keyboard button to
            enter the number.
          </p>
        )}
      {error && (
        <p
          role="alert"
          className="bg-destructive/90 absolute inset-x-6 bottom-6 rounded-xl px-4 py-3 text-center text-sm"
        >
          {error}
        </p>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          if (event.target.files?.length) comingSoon()
          event.target.value = ''
        }}
      />
    </div>
  )
}
