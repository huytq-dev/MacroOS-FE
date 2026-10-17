'use client'

import { useEffect, useState } from 'react'

/**
 * `true` khi cửa sổ đã cuộn quá `enter` px, về `false` khi quay lại dưới `leave` px. Hai ngưỡng khác nhau (độ trễ) để
 * header co/giãn không làm vị trí cuộn dao động quanh một ngưỡng duy nhất.
 */
export function useScrolledPast(enter: number, leave: number) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      setScrolled((current) => (current ? y > leave : y > enter))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enter, leave])

  return scrolled
}
