'use client'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { onboardingService } from '../services/onboarding.service'
import { programService } from '@/features/program/services/program.service'
import { programKeys } from '@/features/program/hooks/use-program'
import type { CreateProgramRequest } from '@/features/program/types/program.types'
import type { PreviewRequest } from '../types/onboarding.types'

export const onboardingKeys = {
  state: ['onboarding', 'state'] as const,
  estimate: ['onboarding', 'estimate'] as const,
  preview: (request: PreviewRequest) => ['onboarding', 'preview', request] as const,
}

export const useOnboardingState = () =>
  useQuery({
    queryKey: onboardingKeys.state,
    queryFn: () => onboardingService.getState(),
    staleTime: 60 * 1000,
  })

/** Lưu đáp án Basics từng bước; lỗi hiện inline ở bước (không toast). */
export const useSaveBasics = () => useMutation({ mutationFn: onboardingService.saveBasics })

/** TDEE khởi điểm: tải khi tới màn ước tính (sau khi đã lưu cân nặng/chiều cao/ngày sinh). */
export const useTdeeEstimate = (enabled: boolean) =>
  useQuery({
    queryKey: onboardingKeys.estimate,
    queryFn: () => onboardingService.estimate(),
    enabled,
    staleTime: 0,
  })

/** Xem trước goal/program: giữ kết quả cũ trong lúc tính lại để số không nháy về trống khi kéo thanh trượt. */
export const useProgramPreview = (request: PreviewRequest | null) =>
  useQuery({
    queryKey: request ? onboardingKeys.preview(request) : ['onboarding', 'preview', 'idle'],
    queryFn: () => onboardingService.preview(request as PreviewRequest), // enabled chỉ bật khi request khác null
    enabled: request !== null,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })

export const useCreateOnboardingProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProgramRequest) => programService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: programKeys.current })
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.state })
    },
  })
}

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: onboardingService.complete,
    // Chờ state mới về rồi mới cho rời wizard, nếu không guard thấy isRequired cũ và đá ngược lại
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.state }),
  })
}
