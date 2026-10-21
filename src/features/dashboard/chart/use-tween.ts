'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Số chạy mượt tới `target` trong `ms` mili giây (ease-out): dùng để "giãn nở" trục X khi đổi kỳ (1W → 1M…) và trục Y khi đổi chế độ.
 * Lần render đầu dùng thẳng `target` (không chạy); đổi `target` giữa chừng thì chạy tiếp từ giá trị đang hiện. Tắt chuyển động khi
 * người dùng chọn giảm chuyển động (nhảy thẳng tới đích ở khung hình kế).
 */
export function useTween(target: number, ms = 400): number {
  const [value, setValue] = useState(target)
  const current = useRef(target)

  useEffect(() => {
    const from = current.current
    if (from === target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = reduce ? 1 : Math.min(1, (now - start) / ms)
      const eased = 1 - (1 - t) ** 3
      current.current = from + (target - from) * eased
      setValue(current.current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, ms])

  return value
}
