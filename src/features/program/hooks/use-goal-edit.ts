'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/api'
import { goalEditService } from '../services/goal-edit.service'
import type { GoalEditPreviewRequest, GoalEditRequest } from '../types/goal-edit.types'
import { programKeys } from './use-program'

/**
 * Preview của màn Edit Goal: mọi số (ngân sách, ngày dự kiến, tốc độ, các thay đổi) do BE tính, FE không tự tính công thức. Khoá theo
 * (đích, tốc độ) nên kéo thước / slider thì chỉ gọi khi giá trị đã debounce đổi; giữ số cũ trong lúc tải để màn không nháy.
 */
export const useGoalEditPreview = (request: GoalEditPreviewRequest, enabled = true) =>
  useQuery({
    queryKey: [
      'goals',
      'edit-preview',
      request.targetWeightKg ?? null,
      request.weeklyRatePercent ?? null,
    ],
    queryFn: async () => {
      const preview = await goalEditService.preview(request)
      if (!preview) throw new Error('Empty goal preview')
      return preview
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: false,
  })

/** Lưu goal (một lệnh atomic); xong thì làm mới program, goal, lịch sử goal và check-in. */
export const useSaveGoalEdit = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GoalEditRequest) => goalEditService.save(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: programKeys.current })
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
      void queryClient.invalidateQueries({ queryKey: ['check-in'] })
    },
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't update your goal")
    },
  })
}
