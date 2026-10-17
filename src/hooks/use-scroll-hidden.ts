'use client'

import { useEffect, useState } from 'react'

const TOP_ZONE = 24
const MIN_DELTA = 6

/**
 * `true` khi người dùng đang cuộn xuống (ẩn thanh nổi), `false` khi cuộn lên hoặc đang ở đầu trang (hiện lại).
 * Lắng nghe cuộn của cửa sổ (trang chạy trên điện thoại cuộn theo `window`), bỏ qua dao động nhỏ dưới `MIN_DELTA` px.
 */
export function useScrollHidden() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 2
      if (y < TOP_ZONE) setHidden(false)
      else if (Math.abs(y - last) >= MIN_DELTA) setHidden(y > last && !atBottom)
      last = y
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return hidden
}
