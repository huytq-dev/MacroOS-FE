'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { dashboardService } from '../services/dashboard.service'

export const useDailyProgress = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: ['expenditure', 'daily', from ?? '', to ?? ''],
    queryFn: () => dashboardService.dailyProgress(from ?? '', to ?? ''),
    enabled: Boolean(from && to),
  })

/** Biến thiên TDEE 3/7/14/30/90 ngày do BE tính; lỗi (API cũ chưa có) thì trang tự suy từ điểm đã tải. */
export const useExpenditureChanges = () =>
  useQuery({
    queryKey: ['expenditure', 'changes'],
    queryFn: () => dashboardService.expenditureChanges(),
    retry: false,
  })

/** 404 = chưa có goal đang hoạt động (không phải lỗi) → data null. */
export const useGoalProgress = () =>
  useQuery({
    queryKey: ['goals', 'progress'],
    queryFn: async () => {
      try {
        return await dashboardService.goalProgress()
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) return null
        throw error
      }
    },
  })

/** Bước chân (`GET /steps`, mặc định 30 ngày): tile Steps lấy trung bình 7 ngày; null = chưa có. */
export const useSteps = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: ['steps', from ?? '', to ?? ''],
    queryFn: () => dashboardService.steps(from ?? '', to ?? ''),
    enabled: Boolean(from && to),
  })

/** Kỳ kinh (`GET /periods`): tile Period vẽ lưới 30 ngày và "N days ago". */
export const usePeriods = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: ['periods', from ?? '', to ?? ''],
    queryFn: () => dashboardService.periods(from ?? '', to ?? ''),
    enabled: Boolean(from && to),
  })

/** Mọi chất dinh dưỡng của một ngày (`GET /nutrients?date=`): giá trị, floor / target / ceiling; amount null = chưa có dữ liệu. */
export const useDayNutrients = (date: string | null) =>
  useQuery({
    queryKey: ['nutrients', date ?? ''],
    queryFn: () => dashboardService.nutrients(date ?? ''),
    enabled: Boolean(date),
  })

export const useExpenditureSeries = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: ['expenditure', from ?? '', to ?? ''],
    queryFn: () => dashboardService.expenditure(from ?? '', to ?? ''),
    enabled: Boolean(from && to),
  })

const choiceListeners = new Set<() => void>()
const subscribeChoice = (listener: () => void) => {
  choiceListeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    choiceListeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/**
 * Lựa chọn nhớ bằng localStorage (Đã ăn/Còn lại, Tiêu hao/Mục tiêu); mọi nơi dùng chung key tự cập nhật theo.
 * Máy chủ và lần render đầu luôn dùng `initial` để không lệch hydration; lỗi storage (chế độ riêng tư) thì bỏ qua.
 */
export function usePersistedChoice<T extends string>(
  key: string,
  initial: T,
  allowed: readonly T[]
) {
  const value = useSyncExternalStore(
    subscribeChoice,
    () => {
      try {
        const stored = window.localStorage.getItem(key)
        return allowed.includes(stored as T) ? (stored as T) : initial
      } catch {
        return initial
      }
    },
    () => initial
  )
  const set = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next)
      } catch {
        // không có storage: lựa chọn chỉ đổi trong phiên này
      }
      choiceListeners.forEach((listener) => listener())
    },
    [key]
  )
  return [value, set] as const
}
