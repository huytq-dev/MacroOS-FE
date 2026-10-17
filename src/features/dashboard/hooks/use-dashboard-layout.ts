'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { DEFAULT_LAYOUT, sanitizeLayout, type DashboardLayout } from '../dashboard-layout'

const STORAGE_KEY = 'dashboard.layout.v1'
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Bố cục Dashboard (trang tiêu điểm, nhóm ô, ô đang hiện) lưu trong localStorage; máy chủ và lần render đầu
 * dùng bố cục mặc định để không lệch hydration. BE có `/dashboard/layout` thì chỉ cần đổi nguồn ở hook này.
 */
export function useDashboardLayout() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null)
  const layout = useMemo<DashboardLayout>(() => {
    if (!raw) return DEFAULT_LAYOUT
    try {
      return sanitizeLayout(JSON.parse(raw))
    } catch {
      return DEFAULT_LAYOUT
    }
  }, [raw])

  const save = useCallback((next: DashboardLayout) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // không có storage: bố cục chỉ đổi trong phiên này
    }
    listeners.forEach((listener) => listener())
  }, [])

  return [layout, save] as const
}
