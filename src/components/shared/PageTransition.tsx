'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Lần đổi trang tới là do Back/Forward của trình duyệt (popstate) hay do người dùng bấm link: popstate bật cờ, mọi cú click tắt cờ.
 * Không dựa vào thời gian vì trang có thể tải lâu (dev server, mạng chậm).
 */
let goingBack = false
let listening = false

function listenPop() {
  if (listening) return
  listening = true
  const markBack = () => {
    goingBack = true
  }
  // Trình duyệt có Navigation API: sự kiện "navigate" kiểu traverse bắn trước khi router dựng trang cũ (sớm hơn popstate)
  const nav = (window as Window & { navigation?: EventTarget }).navigation
  nav?.addEventListener('navigate', (event) => {
    if ((event as Event & { navigationType?: string }).navigationType === 'traverse') markBack()
  })
  // Trình duyệt không có Navigation API: popstate, pha capture để chạy trước listener của router
  window.addEventListener('popstate', markBack, true)
  window.addEventListener(
    'click',
    () => {
      goingBack = false
    },
    true
  )
}

/**
 * Hoạt ảnh vào trang kiểu MacroFactor, đặt `key={pathname}` ở chỗ dùng để mỗi trang dựng mới: trang con trượt vào từ phải khi tiến,
 * từ trái khi Back; trang cấp một (tab chính) chỉ mờ dần vào. `motion-reduce` thì không chạy.
 */
export function PageTransition({
  depth,
  children,
}: {
  /** Số đoạn của đường dẫn (/dashboard = 1, /dashboard/expenditure = 2). */
  readonly depth: number
  readonly children: React.ReactNode
}) {
  const [back] = useState(() => goingBack)
  useEffect(() => {
    listenPop()
    goingBack = false
  }, [])

  return (
    <div
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 flex w-full flex-1 flex-col motion-safe:duration-300 motion-safe:ease-out',
        back
          ? 'motion-safe:slide-in-from-left-1/4'
          : depth > 1 && 'motion-safe:slide-in-from-right-full'
      )}
    >
      {children}
    </div>
  )
}
