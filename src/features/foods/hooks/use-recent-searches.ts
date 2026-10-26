'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { RECENT_SEARCH_KEY, addRecentSearch, parseRecentSearches } from '../food-search.utils'

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const readRaw = (): string | null => {
  try {
    return window.localStorage.getItem(RECENT_SEARCH_KEY)
  } catch {
    return null
  }
}
const write = (list: readonly string[]) => {
  try {
    if (list.length === 0) window.localStorage.removeItem(RECENT_SEARCH_KEY)
    else window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(list))
  } catch {
    // localStorage bị chặn: bỏ qua, ô tìm vẫn chạy bình thường chỉ là không nhớ từ khoá
  }
  listeners.forEach((listener) => listener())
}

/** Từ khoá đã tìm gần đây (tối đa 6, mới nhất trước) cho ô tìm món: hiện khi chưa gõ gì, chạm một từ khoá để tìm lại. Lưu theo trình duyệt, không gửi lên BE. */
export function useRecentSearches() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null)
  const list = useMemo(() => parseRecentSearches(raw), [raw])
  const remember = useCallback(
    (query: string) => write(addRecentSearch(parseRecentSearches(readRaw()), query)),
    []
  )
  const clear = useCallback(() => write([]), [])
  return { list, remember, clear }
}
