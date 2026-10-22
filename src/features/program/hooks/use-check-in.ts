'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { invalidateLogData, invalidateTargetData } from '@/features/food-log/hooks/use-food-log'
import { logger } from '@/lib/api'
import { checkInService } from '../services/check-in.service'
import type { SetCheckInModulesRequest } from '../types/check-in.types'

export const checkInKeys = { session: ['check-in', 'session'] as const }

/** Hub check-in dùng chung cho hub và mọi module: một request gộp module + 7 ngày kcal + preview đề xuất. Chỉ tải ở các route check-in. */
export const useCheckInSession = () =>
  useQuery({
    queryKey: checkInKeys.session,
    queryFn: async () => {
      const session = await checkInService.getSession()
      if (!session) throw new Error('Empty check-in session')
      return session
    },
    staleTime: 0,
  })

/** Đặt tập ngày log chưa đủ: BE dựng lại expenditure rồi trả luôn session mới → ghi thẳng vào cache, không refetch. */
export const useSetIncompleteDays = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dates: string[]) => checkInService.setIncompleteDays(dates),
    onSuccess: (session) => {
      if (session) queryClient.setQueryData(checkInKeys.session, session)
      // BE dựng lại expenditure từ tập ngày chưa đủ và đổi cờ `isIncomplete` của các ngày: nhật ký, nutrients, Nutrition Overview, Expenditure và
      // Energy Balance đều phải đọc lại (`invalidateLogData`)
      invalidateLogData(queryClient)
    },
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't save your selection")
    },
  })
}

/** Lưu cờ module (đã xem Introduction, tắt Partial Logging); xong thì tải lại session để danh sách module đúng. */
export const useSetCheckInModules = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetCheckInModulesRequest) => checkInService.setModules(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: checkInKeys.session }),
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't save your modules")
    },
  })
}

/** Accept / Reject đổi target tuần → làm mới program, goal, check-in và mọi số hiển thị theo target (`invalidateTargetData`). Lặp cùng quyết định là an toàn (BE trả Id cũ). */
const useDecision = (decide: () => Promise<unknown>) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: decide,
    onSuccess: () => invalidateTargetData(queryClient),
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't update your program")
    },
  })
}

export const useAcceptCheckIn = () => useDecision(() => checkInService.accept())
export const useRejectCheckIn = () => useDecision(() => checkInService.reject())
