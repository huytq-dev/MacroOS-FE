'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Kéo sang trái quá ngưỡng này (px) là xoá luôn; kéo vừa phải thì chừa nút Delete đỏ để bấm. */
const COMMIT_PX = 150
const REVEAL_PX = 88

interface SwipeToDeleteProps {
  readonly onDelete: () => void
  /** Tắt vuốt (đang sửa, đang lưu…): nút Delete vẫn không hiện. */
  readonly disabled?: boolean
  /** Lớp của mặt trước (nền, padding, bố cục); nền đỏ và bo góc `rounded-xl` do khung ngoài giữ. */
  readonly className?: string
  readonly children: React.ReactNode
}

/**
 * Hàng vuốt sang trái để xoá (như iOS): kéo ngắn lộ nút Delete đỏ bấm được, kéo dài quá ngưỡng xoá luôn. Cử chỉ chỉ nhận khi vuốt
 * ngang (vuốt dọc vẫn cuộn trang), có chuyển động 300ms khi nhả; nút Delete vẫn focus được bằng bàn phím khi đã lộ.
 */
export function SwipeToDelete({
  onDelete,
  disabled = false,
  className,
  children,
}: SwipeToDeleteProps) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<{ x: number; y: number; base: number; axis: 'x' | 'y' | null } | null>(
    null
  )

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    gesture.current = { x: event.clientX, y: event.clientY, base: offset, axis: null }
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = gesture.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (start.axis === 'x') {
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
      }
    }
    if (start.axis === 'x') setOffset(Math.min(0, Math.max(-220, start.base + dx)))
  }
  const finish = () => {
    const start = gesture.current
    gesture.current = null
    if (start?.axis !== 'x') return
    setDragging(false)
    if (offset < -COMMIT_PX) onDelete()
    else setOffset(offset < -REVEAL_PX / 2 ? -REVEAL_PX : 0)
  }

  return (
    <div className="bg-destructive relative overflow-hidden rounded-xl">
      <button
        type="button"
        tabIndex={offset === 0 ? -1 : 0}
        aria-hidden={offset === 0}
        disabled={disabled}
        onClick={onDelete}
        className="text-background absolute inset-y-0 right-0 flex w-[88px] items-center justify-center text-base font-medium"
      >
        Delete
      </button>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        style={{ transform: `translateX(${offset}px)` }}
        className={cn(
          'bg-card relative touch-pan-y select-none',
          !dragging && 'transition-transform duration-300 ease-out motion-reduce:transition-none',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
