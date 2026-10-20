'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Loader2, RotateCcw, RotateCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  MAX_ZOOM,
  clampPan,
  coverScale,
  loadImage,
  renderCrop,
  type CropState,
} from '../image.utils'

interface CropPhotoScreenProps {
  /** Ảnh vừa chọn / chụp. */
  readonly file: File
  readonly onCancel: () => void
  /** JPEG vuông 1080×1080 đã cắt. */
  readonly onConfirm: (blob: Blob) => void
}

const START: CropState = { turns: 0, zoom: 1, panX: 0, panY: 0 }

const CORNERS = [
  'top-0 left-0 border-t-2 border-l-2',
  'top-0 right-0 border-t-2 border-r-2',
  'bottom-0 left-0 border-b-2 border-l-2',
  'bottom-0 right-0 border-b-2 border-r-2',
] as const

/**
 * Màn "Crop Photo" toàn màn hình (như MacroFactor): khung vuông có bốn góc trắng, kéo để dời và chụm / cuộn để phóng, ba nút xoay trái /
 * đặt lại / xoay phải, ✕ huỷ và ✓ vàng xác nhận. Ảnh luôn phủ kín khung; kết quả là JPEG vuông 1080×1080 (chất lượng 0.85).
 */
export function CropPhotoScreen({ file, onCancel, onConfirm }: CropPhotoScreenProps) {
  const [url] = useState(() => URL.createObjectURL(file))
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [failed, setFailed] = useState(false)
  const [state, setState] = useState<CropState>(START)
  const [frame, setFrame] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const lastPinch = useRef<number | null>(null)

  useEffect(() => {
    let alive = true
    loadImage(url).then(
      (loaded) => alive && setImage(loaded),
      () => alive && setFailed(true)
    )
    return () => {
      alive = false
    }
  }, [url])

  // Thu hồi URL blob khi đóng màn (không làm trong cleanup của effect: StrictMode chạy cleanup giữa chừng khi ảnh còn đang tải)
  const dismiss = useCallback(() => {
    URL.revokeObjectURL(url)
    onCancel()
  }, [url, onCancel])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && dismiss()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])

  const measure = (node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new ResizeObserver(() => setFrame(node.clientWidth))
    observer.observe(node)
    setFrame(node.clientWidth)
  }

  const update = (next: Partial<CropState>) => {
    if (!image || !frame) return
    setState((current) => {
      const merged = { ...current, ...next }
      const pan = clampPan(image, merged, frame, { x: merged.panX, y: merged.panY })
      return { ...merged, panX: pan.x, panY: pan.y }
    })
  }

  const onPointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    setDragging(true)
    lastPinch.current = null
  }
  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      if (lastPinch.current) {
        update({
          zoom: Math.min(MAX_ZOOM, Math.max(1, state.zoom * (distance / lastPinch.current))),
        })
      }
      lastPinch.current = distance
      return
    }
    update({
      panX: state.panX + event.clientX - previous.x,
      panY: state.panY + event.clientY - previous.y,
    })
  }
  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId)
    lastPinch.current = null
    if (pointers.current.size === 0) setDragging(false)
  }

  const confirm = async () => {
    if (!image || !frame || busy) return
    setBusy(true)
    try {
      const blob = await renderCrop(image, state, frame)
      URL.revokeObjectURL(url)
      onConfirm(blob)
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  const scale = image && frame ? coverScale(image, state.turns, frame) * state.zoom : 1
  const changed = state.turns !== 0 || state.zoom !== 1 || state.panX !== 0 || state.panY !== 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop photo"
      className="bg-background motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animation-duration-200 fixed inset-0 z-[80] flex flex-col"
    >
      <h2 className="pt-[max(1.25rem,env(safe-area-inset-top))] text-center text-lg font-medium">
        Crop Photo
      </h2>

      <div className="flex min-h-0 flex-1 items-center px-4">
        <div className="relative mx-auto w-full max-w-md">
          <div
            ref={measure}
            role="img"
            aria-label="Photo crop area. Drag to move, pinch or scroll to zoom."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={(event) =>
              update({
                zoom: Math.min(
                  MAX_ZOOM,
                  Math.max(1, state.zoom * (event.deltaY < 0 ? 1.08 : 0.92))
                ),
              })
            }
            className="relative aspect-square w-full cursor-grab touch-none overflow-visible select-none active:cursor-grabbing"
          >
            {image && frame > 0 && (
              // eslint-disable-next-line @next/next/no-img-element -- blob cục bộ, next/image không tối ưu được
              <img
                src={url}
                alt=""
                draggable={false}
                className={cn(
                  'absolute top-1/2 left-1/2 max-w-none origin-center',
                  !dragging && 'motion-safe:transition-transform motion-safe:duration-200'
                )}
                style={{
                  width: image.width,
                  height: image.height,
                  transform: `translate(-50%, -50%) translate(${state.panX}px, ${state.panY}px) rotate(${state.turns * 90}deg) scale(${scale})`,
                }}
              />
            )}
            {/* Phần ngoài khung tối đi; bốn góc trắng */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 shadow-[0_0_0_100vmax_rgb(0_0_0/0.65)]"
            >
              {CORNERS.map((corner) => (
                <span key={corner} className={cn('absolute size-6 border-white', corner)} />
              ))}
            </div>
            {!image && !failed && (
              <div className="absolute inset-0 flex items-center justify-center" aria-busy="true">
                <Loader2 aria-hidden="true" className="text-muted-foreground size-8 animate-spin" />
              </div>
            )}
            {failed && (
              <p
                role="alert"
                className="bg-card absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl px-4 py-3 text-center text-base"
              >
                Couldn&apos;t read this photo. Try a JPEG, PNG or WebP image.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          aria-label="Cancel crop"
          onClick={dismiss}
          className="bg-secondary focus-visible:ring-ring/50 flex size-14 items-center justify-center rounded-full transition-transform duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
        >
          <X aria-hidden="true" className="size-6" />
        </button>

        <div className="bg-secondary flex items-center rounded-full">
          <button
            type="button"
            aria-label="Rotate left"
            disabled={!image}
            onClick={() => update({ turns: (state.turns + 3) % 4, panX: 0, panY: 0 })}
            className="focus-visible:ring-ring/50 flex size-14 items-center justify-center rounded-full transition-transform duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-90 disabled:opacity-40 motion-reduce:active:scale-100"
          >
            <RotateCcw aria-hidden="true" className="size-6" />
          </button>
          <button
            type="button"
            aria-label="Reset crop"
            disabled={!image || !changed}
            onClick={() => setState(START)}
            className="text-muted-foreground focus-visible:ring-ring/50 flex h-14 w-16 items-center justify-center rounded-full text-sm transition-opacity duration-200 focus-visible:ring-1 focus-visible:outline-none disabled:opacity-40"
          >
            Reset
          </button>
          <button
            type="button"
            aria-label="Rotate right"
            disabled={!image}
            onClick={() => update({ turns: (state.turns + 1) % 4, panX: 0, panY: 0 })}
            className="focus-visible:ring-ring/50 flex size-14 items-center justify-center rounded-full transition-transform duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-90 disabled:opacity-40 motion-reduce:active:scale-100"
          >
            <RotateCw aria-hidden="true" className="size-6" />
          </button>
        </div>

        <button
          type="button"
          aria-label="Use this crop"
          disabled={!image || busy}
          aria-busy={busy}
          onClick={confirm}
          className="bg-shortcut-yellow text-background focus-visible:ring-ring/50 flex size-14 items-center justify-center rounded-full transition-transform duration-100 focus-visible:ring-1 focus-visible:outline-none active:scale-90 disabled:opacity-60 motion-reduce:active:scale-100"
        >
          {busy ? (
            <Loader2 aria-hidden="true" className="size-6 animate-spin" />
          ) : (
            <Check aria-hidden="true" className="size-7" />
          )}
        </button>
      </div>
    </div>
  )
}
