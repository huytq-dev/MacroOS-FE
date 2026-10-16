'use client'

import { useEffect, useState } from 'react'

/**
 * Chiều cao bàn phím ảo (px) trên iOS Safari: bàn phím không co layout viewport nên thanh dính đáy
 * (ô tìm ở sheet Thêm món) bị che. Dùng làm `bottom` của phần tử `fixed bottom-0`. Desktop luôn 0.
 */
export function useKeyboardInset(active: boolean): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!active || !viewport) return
    const update = () =>
      setInset(Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)))
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [active])

  return active ? inset : 0
}
