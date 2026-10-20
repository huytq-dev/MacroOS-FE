'use client'

import { useRef } from 'react'

/** Quãng kéo ngang tối thiểu để tính là vuốt. */
const SWIPE_MIN_PX = 50

interface SwipeAreaProps {
  /** Vuốt sang trái (đi tới ngày mới hơn). */
  readonly onNext: () => void
  /** Vuốt sang phải (về ngày cũ hơn). */
  readonly onPrevious: () => void
  readonly children: React.ReactNode
}

/** Vùng nội dung vuốt ngang để đổi ngày; vẫn cuộn dọc bình thường (`touch-action: pan-y`). */
export function SwipeArea({ onNext, onPrevious, children }: SwipeAreaProps) {
  const start = useRef<{ x: number; y: number } | null>(null)
  return (
    <div
      className="touch-pan-y"
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerUp={(event) => {
        const origin = start.current
        start.current = null
        if (!origin) return
        const dx = event.clientX - origin.x
        if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(event.clientY - origin.y)) return
        if (dx < 0) onNext()
        else onPrevious()
      }}
      onPointerCancel={() => {
        start.current = null
      }}
    >
      {children}
    </div>
  )
}
