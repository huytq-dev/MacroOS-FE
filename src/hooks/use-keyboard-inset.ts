'use client'

import { useEffect, useState } from 'react'

/** Vùng màn hình còn nhìn thấy phía trên bàn phím ảo, tính theo toạ độ của phần tử `position: fixed`. */
export interface VisibleViewport {
  /** Chiều cao vùng nhìn thấy (px). */
  readonly height: number
  /** Khoảng cách từ đáy layout viewport tới mép trên bàn phím (px): dùng làm `bottom` của phần tử fixed đáy. */
  readonly bottom: number
  /** Khoảng cách từ đỉnh layout viewport tới đỉnh vùng nhìn thấy (px): iOS "đẩy" trang lên khi bàn phím mở, header sticky cần dịch xuống đúng số này. */
  readonly top: number
}

/**
 * iOS Safari mở bàn phím không co layout viewport mà thu nhỏ visual viewport và tự cuộn trang; phần tử `fixed` cao 100dvh vì thế bị
 * đẩy lên khỏi màn hình (mất header) và nhảy theo mỗi lần cuộn. Hook trả vùng nhìn thấy để sheet co đúng phần phía trên bàn phím.
 * null khi bàn phím đóng, trên desktop, hoặc Android dùng `interactive-widget=resizes-content` (layout tự co nên dvh đã đúng).
 */
export function useVisibleViewport(active: boolean): VisibleViewport | null {
  const [box, setBox] = useState<VisibleViewport | null>(null)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!active || !viewport) return
    let frame = 0
    // Gom các sự kiện resize/scroll trong lúc bàn phím trượt lên vào một lần cập nhật mỗi khung hình để không giật
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // scale > 1 là người dùng đang phóng to bằng hai ngón (visual viewport cũng nhỏ lại) chứ không phải bàn phím
        const keyboardOpen = viewport.scale < 1.01 && window.innerHeight - viewport.height > 1
        setBox(
          keyboardOpen
            ? {
                height: Math.round(viewport.height),
                top: Math.max(0, Math.round(viewport.offsetTop)),
                bottom: Math.max(
                  0,
                  Math.round(window.innerHeight - viewport.height - viewport.offsetTop)
                ),
              }
            : null
        )
      })
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [active])

  return active ? box : null
}
