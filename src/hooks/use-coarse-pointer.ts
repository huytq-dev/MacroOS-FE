'use client'

import { useSyncExternalStore } from 'react'

/** Điện thoại / máy tính bảng: con trỏ thô, hoặc thiết bị không có hover (iOS Safari luôn là một trong hai). */
const QUERIES = ['(pointer: coarse)', '(hover: none)'] as const

const subscribe = (notify: () => void) => {
  const medias = QUERIES.map((query) => window.matchMedia(query))
  medias.forEach((media) => media.addEventListener('change', notify))
  return () => medias.forEach((media) => media.removeEventListener('change', notify))
}

const isTouchDevice = () =>
  QUERIES.some((query) => window.matchMedia(query).matches) ||
  // Một số trình duyệt di động báo sai media query: có sự kiện chạm / điểm chạm mà không có con trỏ chính xác thì vẫn là cảm ứng
  (('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
    !window.matchMedia('(pointer: fine)').matches)

/**
 * Thiết bị chính là cảm ứng (điện thoại/máy tính bảng): dùng bàn phím số riêng thay cho bàn phím hệ thống. Server và lần render
 * đầu của client trả false nên không lệch hydration; ngay sau hydration giá trị thật được áp (đồng bộ, không chờ effect).
 */
export const useCoarsePointer = () => useSyncExternalStore(subscribe, isTouchDevice, () => false)
