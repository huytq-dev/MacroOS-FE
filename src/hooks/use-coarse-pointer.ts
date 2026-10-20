'use client'

import { useSyncExternalStore } from 'react'

/** Điện thoại / máy tính bảng: con trỏ thô, hoặc thiết bị không có hover (iOS Safari luôn là một trong hai). */
const QUERIES = ['(pointer: coarse)', '(hover: none)'] as const

/** Đã thấy một lần chạm thật (pointerdown kiểu touch hoặc touchstart): chắc chắn là thiết bị cảm ứng dù media query báo sai. */
let touchSeen = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

const markTouch = (event: Event) => {
  if (touchSeen) return
  if (event.type === 'pointerdown' && (event as PointerEvent).pointerType !== 'touch') return
  touchSeen = true
  notify()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  const medias = QUERIES.map((query) => window.matchMedia(query))
  medias.forEach((media) => media.addEventListener('change', listener))
  // Capture ở window: chạy trước mọi sự kiện focus/mousedown giả lập của lần chạm, nên inputMode đã đổi trước khi ô nhận focus
  window.addEventListener('pointerdown', markTouch, { capture: true, passive: true })
  window.addEventListener('touchstart', markTouch, { capture: true, passive: true })
  return () => {
    listeners.delete(listener)
    medias.forEach((media) => media.removeEventListener('change', listener))
    window.removeEventListener('pointerdown', markTouch, { capture: true })
    window.removeEventListener('touchstart', markTouch, { capture: true })
  }
}

const isTouchDevice = () =>
  touchSeen ||
  QUERIES.some((query) => window.matchMedia(query).matches) ||
  // Một số trình duyệt di động báo sai media query: có sự kiện chạm / điểm chạm mà không có con trỏ chính xác thì vẫn là cảm ứng
  (('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
    !window.matchMedia('(pointer: fine)').matches)

/**
 * Thiết bị chính là cảm ứng (điện thoại/máy tính bảng): dùng bàn phím số riêng thay cho bàn phím hệ thống. Server và lần render
 * đầu của client trả false nên không lệch hydration; ngay sau hydration giá trị thật được áp (đồng bộ, không chờ effect) và lần
 * chạm đầu tiên cũng bật cờ cảm ứng trước khi ô nhập kịp nhận focus.
 */
export const useCoarsePointer = () => useSyncExternalStore(subscribe, isTouchDevice, () => false)
