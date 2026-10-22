'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/api'
import { goalEditService } from '../services/goal-edit.service'
import type { GoalEditPreviewRequest, GoalEditRequest } from '../types/goal-edit.types'
import { invalidateTargetData } from '@/features/food-log/hooks/use-food-log'

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

/** Lưu goal (một lệnh atomic); xong thì làm mới program, goal, lịch sử goal, check-in và mọi số hiển thị theo target (`invalidateTargetData`). */
export const useSaveGoalEdit = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GoalEditRequest) => goalEditService.save(payload),
    onSuccess: () => invalidateTargetData(queryClient),
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't update your goal")
    },
  })
}
