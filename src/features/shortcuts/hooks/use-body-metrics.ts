'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/api'
import { bodyMetricsService } from '../services/body-metrics.service'
import type { FullBodyRequest, PhotoAngle } from '../types/body-metrics.types'

export const bodyMetricKeys = {
  fullBody: (date: string) => ['body-metrics', 'full-body', date] as const,
  fullBodyHistory: ['body-metrics', 'full-body-history'] as const,
  photos: (date: string) => ['progress-photos', date] as const,
}

/** Số đo cơ thể của một ngày (điền sẵn vào sheet Metrics). Chỉ tải khi sheet mở. */
export const useFullBody = (date: string, enabled: boolean) =>
  useQuery({
    queryKey: bodyMetricKeys.fullBody(date),
    queryFn: () => bodyMetricsService.getFullBody(date),
    enabled,
  })

/** Mọi ngày có số đo Full Body (danh sách theo tháng, tab ngày của All Metrics, Compare); lưu / xoá invalidate cả nhóm 'body-metrics'. */
export const useFullBodyHistory = () =>
  useQuery({
    queryKey: bodyMetricKeys.fullBodyHistory,
    queryFn: () => bodyMetricsService.getFullBodyHistory(),
    select: (data) => data?.items ?? [],
  })

export const useSaveFullBody = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: FullBodyRequest) => bodyMetricsService.saveFullBody(payload),
    onSuccess: () => {
      toast.success('Metrics saved')
      void queryClient.invalidateQueries({ queryKey: ['body-metrics'] })
    },
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't save metrics")
    },
  })
}

export const useDeleteFullBody = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (date: string) => bodyMetricsService.deleteFullBody(date),
    onSuccess: () => {
      toast.success('Metrics deleted')
      void queryClient.invalidateQueries({ queryKey: ['body-metrics'] })
    },
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't delete metrics")
    },
  })
}

/** Ảnh tiến độ của một ngày: URL có chữ ký hết hạn ~15 phút nên không giữ cache (staleTime 0, gc ngắn). */
export const useProgressPhotos = (date: string, enabled: boolean) =>
  useQuery({
    queryKey: bodyMetricKeys.photos(date),
    queryFn: () => bodyMetricsService.getPhotos(date),
    enabled,
    staleTime: 0,
    gcTime: 60 * 1000,
  })

export const useUploadPhotos = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // Tuần tự: lần đầu mang consent, các ảnh sau không cần
    mutationFn: async (payload: {
      date: string
      consent: boolean
      files: readonly { angle: PhotoAngle; file: File }[]
    }) => {
      for (const { angle, file } of payload.files)
        await bodyMetricsService.uploadPhoto({
          file,
          angle,
          date: payload.date,
          consent: payload.consent,
        })
    },
    onSuccess: () => {
      toast.success('Photos saved')
      void queryClient.invalidateQueries({ queryKey: ['progress-photos'] })
    },
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't save photos")
    },
  })
}

export const useDeletePhotos = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (date: string) => bodyMetricsService.deletePhotos(date),
    onSuccess: () => {
      toast.success('Photos deleted')
      void queryClient.invalidateQueries({ queryKey: ['progress-photos'] })
    },
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't delete photos")
    },
  })
}
