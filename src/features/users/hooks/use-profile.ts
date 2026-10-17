'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { userService } from '../services/user.service'
import type { UpdateProfileRequest } from '../types/user.types'
import { logger } from '@/lib/api'

export const profileKeys = { me: ['profile', 'me'] as const }

export const useProfile = () =>
  useQuery({ queryKey: profileKeys.me, queryFn: userService.getProfile, staleTime: 5 * 60 * 1000 })

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userService.updateProfile(payload),
    onSuccess: () => {
      toast.success('Profile saved')
      void queryClient.invalidateQueries({ queryKey: profileKeys.me })
    },
    onError: (error) => {
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở dialog/trang (UI.md mục 10), không toast
    },
  })
}
