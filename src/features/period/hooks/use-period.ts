'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { periodService } from '../services/period.service'
import type { PeriodRequest } from '../types/period.types'
import { logger } from '@/lib/api'

// Cùng tiền tố 'periods' với ô Period của Dashboard (`usePeriods`) nên mọi thay đổi làm mới cả hai
export const periodKeys = {
  all: ['periods'] as const,
  history: (to: string) => ['periods', 'history', to] as const,
}

/** Toàn bộ lịch sử kỳ kinh tới hôm nay; `today` null = chưa mount. */
export const usePeriodHistory = (today: string | null) =>
  useQuery({
    queryKey: periodKeys.history(today ?? ''),
    queryFn: () => periodService.listAll(today ?? ''),
    enabled: Boolean(today),
  })

const usePeriodMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: periodKeys.all })
    },
    onError: (error) => {
      logger.error(error)
      // lỗi nghiệp vụ (vd. 409 trùng ngày bắt đầu) hiện inline ở bảng nhập, không toast
    },
  })
}

export const useCreatePeriod = () =>
  usePeriodMutation((payload: PeriodRequest) => periodService.create(payload), 'Period saved')

export const useUpdatePeriod = () =>
  usePeriodMutation(
    ({ id, payload }: { id: string; payload: PeriodRequest }) => periodService.update(id, payload),
    'Period updated'
  )

export const useDeletePeriod = () =>
  usePeriodMutation((id: string) => periodService.remove(id), 'Deleted')
