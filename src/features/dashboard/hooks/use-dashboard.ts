'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { dashboardService, type MacrosSeriesParams } from '../services/dashboard.service'

/**
 * Chuỗi Macros của BE. Khoá bắt đầu bằng 'nutrients' nên thêm / sửa / xoá món (invalidateLogData) làm mới nó cùng Dashboard. `keepPreviousData` để số tóm tắt
 * không nhấp nháy khi kéo biểu đồ sang khoảng mới.
 */
export const useMacrosSeries = (params: MacrosSeriesParams, enabled: boolean) =>
  useQuery({
    queryKey: [
      'nutrients',
      'macros-series',
      params.from ?? '',
      params.to ?? '',
      params.all ?? false,
      params.granularity ?? '',
    ],
    queryFn: () => dashboardService.macrosSeries(params),
    enabled,
    placeholderData: keepPreviousData,
  })

export const useDailyProgress = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: ['expenditure', 'daily', from ?? '', to ?? ''],
    queryFn: () => dashboardService.dailyProgress(from ?? '', to ?? ''),
    enabled: Boolean(from && to),
  })

/** Energy Balance của khoảng [from, to] từ BE (từng ngày + `summary`): thẻ Energy Balance của Dashboard hiển thị nguyên số của BE, không tự tính trung bình. */
export const useEnergyBalanceWindow = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: ['energy-balance', 'series', from ?? '', to ?? ''],
    queryFn: () => dashboardService.energyBalance(from ?? '', to ?? ''),
    enabled: Boolean(from && to),
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

/** Ghi một lựa chọn nhớ rồi báo mọi nơi đang dùng key đó (cả ngoài hook, vd. More › Tutorials đặt lại cờ "ẩn"). */
export function persistChoice(key: string, next: string) {
  try {
    window.localStorage.setItem(key, next)
  } catch {
    // không có storage: lựa chọn chỉ đổi trong phiên này
  }
  choiceListeners.forEach((listener) => listener())
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
  const set = useCallback((next: T) => persistChoice(key, next), [key])
  return [value, set] as const
}
