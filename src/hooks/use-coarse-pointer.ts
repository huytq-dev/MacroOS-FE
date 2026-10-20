'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(pointer: coarse)'

const subscribe = (notify: () => void) => {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

/** Thiết bị chính là cảm ứng (điện thoại/máy tính bảng). Server và lần render đầu của client trả false nên không lệch hydration. */
export const useCoarsePointer = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
