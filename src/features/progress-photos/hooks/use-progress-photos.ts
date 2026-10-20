'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/api'
import { progressPhotosService } from '../services/progress-photos.service'
import type { PhotoAngle } from '../types/progress-photos.types'

export const photoKeys = { sessions: ['progress-photos', 'sessions'] as const }

/**
 * Mọi ngày có ảnh (mới nhất trước) kèm cân nặng của ngày. URL ảnh có chữ ký hết hạn ~15 phút nên chỉ giữ cache 4 phút và tải lại khi
 * quay lại tab; lưu / xoá ảnh invalidate cả nhóm 'progress-photos' (cả sheet Photos của shortcut).
 */
export const useProgressPhotoSessions = (enabled = true) =>
  useQuery({
    queryKey: photoKeys.sessions,
    queryFn: () => progressPhotosService.sessions(),
    enabled,
    staleTime: 4 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

/** Lưu ảnh của một ngày: gửi tuần tự từng góc (lần đầu mang consent) rồi xoá các góc bị bỏ. */
export const useSavePhotoSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      date: string
      consent: boolean
      uploads: readonly { angle: PhotoAngle; file: Blob }[]
      removals: readonly PhotoAngle[]
    }) => {
      for (const { angle, file } of payload.uploads)
        await progressPhotosService.upload({
          file,
          angle,
          date: payload.date,
          consent: payload.consent,
        })
      for (const angle of payload.removals)
        await progressPhotosService.remove({ date: payload.date, angle })
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

export const useDeletePhotoSession = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (date: string) => progressPhotosService.remove({ date }),
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
