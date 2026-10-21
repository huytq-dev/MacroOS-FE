'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { periodService } from '../services/period.service'
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

/** Đặt một ngày là có / không hành kinh (`PUT /periods/days/{date}`); thành công thì lịch, danh sách và ô Dashboard làm mới ngay. */
export const useSetPeriodDay = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ date, isOnPeriod }: { date: string; isOnPeriod: boolean }) =>
      periodService.setDay(date, { isOnPeriod }),
    onSuccess: (_data, { isOnPeriod }) => {
      toast.success(isOnPeriod ? 'Period day saved' : 'Period day removed')
      void queryClient.invalidateQueries({ queryKey: periodKeys.all })
    },
    onError: (error) => {
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở bảng ngày, không toast
    },
  })
}
