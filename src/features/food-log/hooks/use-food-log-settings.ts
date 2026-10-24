'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foodLogService } from '../services/food-log.service'
import { DEFAULT_FOOD_LOG_SETTINGS, type FoodLogSettings } from '../food-log-settings'
import { logger } from '@/lib/api'

const settingsKey = ['food-log-settings'] as const

/**
 * Cài đặt Food Log lưu trên server (`GET/PUT /food-logs/settings`). Trả về `[settings, update]`: `settings` luôn có giá trị
 * (mặc định cho tới khi tải xong); `update(patch)` cập nhật ngay trên màn hình rồi gửi cả object lên server, lỗi thì hoàn lại.
 * Đổi cờ Branded / Open Food Facts làm kết quả tìm món đổi theo nên làm mới cache món ăn.
 */
export function useFoodLogSettings() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: settingsKey,
    queryFn: foodLogService.getSettings,
    staleTime: 5 * 60 * 1000,
  })
  // Trộn với mặc định: trường mới mà BE chưa trả (API cũ) vẫn có giá trị.
  const settings: FoodLogSettings = { ...DEFAULT_FOOD_LOG_SETTINGS, ...query.data }

  const save = useMutation({
    mutationFn: (next: FoodLogSettings) => foodLogService.saveSettings(next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: settingsKey })
      const previous = queryClient.getQueryData<FoodLogSettings>(settingsKey)
      queryClient.setQueryData(settingsKey, next)
      return { previous }
    },
    onError: (error, _next, context) => {
      logger.error(error)
      queryClient.setQueryData(settingsKey, context?.previous)
    },
    // Cờ Branded / Open Food Facts đổi phạm vi tìm món VÀ danh sách Library của thanh thêm món
    onSuccess: () => {
      for (const queryKey of [['foods'], ['food-log', 'library']] as const)
        void queryClient.invalidateQueries({ queryKey })
    },
  })

  const update = (patch: Partial<FoodLogSettings>) => save.mutate({ ...settings, ...patch })
  return [settings, update] as const
}
