'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidateTargetData } from '@/features/food-log/hooks/use-food-log'
import { logger } from '@/lib/api'
import { expenditureSettingsService } from '../services/expenditure-settings.service'
import type { ExpenditureSettings } from '../types/expenditure-settings.types'

export const expenditureSettingsKeys = { all: ['expenditure', 'settings'] as const }

/** Cài đặt ước tính ban đầu + chế độ tính. `enabled` = cờ BE đã bật; tắt thì không gọi (BE đang chạy chưa có route này). */
export const useExpenditureSettings = (enabled: boolean) =>
  useQuery({
    queryKey: expenditureSettingsKeys.all,
    queryFn: () => expenditureSettingsService.get(),
    enabled,
    staleTime: 60 * 1000,
    retry: false,
  })

/** Ghi xong BE trả lại toàn bộ cài đặt: đặt thẳng vào cache (không "đã lưu" giả), rồi làm mới số phụ thuộc ước tính / target. */
const useSettingsMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<ExpenditureSettings>
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (settings) => {
      queryClient.setQueryData(expenditureSettingsKeys.all, settings)
      invalidateTargetData(queryClient)
    },
    onError: (error) => logger.error(error),
  })
}

export const useSaveExpenditureSettings = () => useSettingsMutation(expenditureSettingsService.save)

export const useSetCalculationMode = () => useSettingsMutation(expenditureSettingsService.setMode)
