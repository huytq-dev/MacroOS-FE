'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { stepsService } from '../services/steps.service'
import type { UpsertStepsRequest } from '../types/steps.types'
import { logger } from '@/lib/api'
import { reportMutationError } from '@/lib/mutation-feedback'

// Cùng tiền tố 'steps' với ô Steps của Dashboard (`useSteps`) nên mọi thay đổi làm mới cả hai
export const stepsKeys = {
  all: ['steps'] as const,
  history: (to: string) => ['steps', 'history', to] as const,
}

/** Toàn bộ lịch sử bước chân tới hôm nay (trang lọc kỳ ở FE); `today` null = chưa mount. */
export const useStepsHistory = (today: string | null) =>
  useQuery({
    queryKey: stepsKeys.history(today ?? ''),
    queryFn: () => stepsService.listAll(today ?? ''),
    enabled: Boolean(today),
  })

const useStepsMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string,
  /** Có = thao tác không có chỗ hiện lỗi inline (xoá): báo user bằng toast thay vì chỉ ghi log. */
  failureTitle?: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: stepsKeys.all })
    },
    onError: (error) => {
      if (failureTitle) return reportMutationError(error, failureTitle)
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở bảng nhập (UI.md mục 10), không toast
    },
  })
}

export const useUpsertSteps = () =>
  useStepsMutation((payload: UpsertStepsRequest) => stepsService.upsert(payload), 'Steps saved')

export const useDeleteSteps = () =>
  useStepsMutation(
    (logDate: string) => stepsService.remove(logDate),
    'Deleted',
    "Couldn't delete steps"
  )
