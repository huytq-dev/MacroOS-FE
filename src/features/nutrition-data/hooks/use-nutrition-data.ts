'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { invalidateLogData } from '@/features/food-log/hooks/use-food-log'
import { logger } from '@/lib/api'
import { nutritionDataService } from '../services/nutrition-data.service'
import type { SaveNutritionDayRequest } from '../types/nutrition-data.types'

const KEY = ['nutrition-data'] as const

/** Mọi ngày có dữ liệu dinh dưỡng (mới nhất trước) cho Nutrition Data Manager. */
export const useNutritionDays = () =>
  useQuery({
    queryKey: KEY,
    queryFn: () => nutritionDataService.list(),
    select: (data) => data?.items ?? [],
  })

/**
 * Lưu / xoá một ngày ảnh hưởng log của ngày đó, nutrients, Nutrition Overview, expenditure và Energy Balance (`invalidateLogData`), cộng danh sách ngày
 * của trang này và xu hướng cân.
 */
const useInvalidate = () => {
  const queryClient = useQueryClient()
  return () => {
    invalidateLogData(queryClient)
    return Promise.all(
      [KEY, ['weights']].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
    )
  }
}

export const useSaveNutritionDay = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (payload: SaveNutritionDayRequest) => nutritionDataService.save(payload),
    onSuccess: () => {
      toast.success('Nutrition saved')
      void invalidate()
    },
    onError: (error) => logger.error(error),
  })
}

export const useDeleteNutritionDay = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (date: string) => nutritionDataService.remove(date),
    onSuccess: () => {
      toast.success('Nutrition deleted')
      void invalidate()
    },
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't delete this day")
    },
  })
}
