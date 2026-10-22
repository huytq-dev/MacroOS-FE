'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { onboardingService } from '../services/onboarding.service'
import { programService } from '@/features/program/services/program.service'
import { invalidateTargetData } from '@/features/food-log/hooks/use-food-log'
import type { CreateProgramRequest } from '@/features/program/types/program.types'
import { profileKeys } from '@/features/users/hooks/use-profile'
import { weightKeys } from '@/features/weight/hooks/use-weights'
import { isClientError } from '@/lib/api'
import type { PreviewRequest } from '../types/onboarding.types'

export const onboardingKeys = {
  state: ['onboarding', 'state'] as const,
  estimate: ['onboarding', 'estimate'] as const,
  preview: (request: PreviewRequest) => ['onboarding', 'preview', request] as const,
}

/**
 * Onboarding ghi hồ sơ (cân nặng, chiều cao, ngày sinh, đơn vị), một lần cân và program: Dashboard sau đó phải đọc hồ sơ (kg / lb, kcal / kJ), cân và target
 * mới chứ không phải bản cache từ trước wizard (hồ sơ giữ 5 phút). Trả về lời hứa làm mới state để guard chỉ thả user ra khi `isRequired` đã đổi.
 */
export function invalidateOnboardingData(queryClient: QueryClient): Promise<void> {
  invalidateTargetData(queryClient)
  for (const queryKey of [profileKeys.me, weightKeys.all])
    void queryClient.invalidateQueries({ queryKey })
  return queryClient.invalidateQueries({ queryKey: onboardingKeys.state })
}

export const useOnboardingState = () =>
  useQuery({
    queryKey: onboardingKeys.state,
    queryFn: () => onboardingService.getState(),
    staleTime: 60 * 1000,
  })

/** Lưu đáp án Basics từng bước (hồ sơ + cân nặng); lỗi hiện inline ở bước (không toast). Hồ sơ đã đổi nên làm mới ngay. */
export const useSaveBasics = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: onboardingService.saveBasics,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.me })
      void queryClient.invalidateQueries({ queryKey: weightKeys.all })
    },
  })
}

/** TDEE khởi điểm: tải khi tới màn ước tính (sau khi đã lưu cân nặng/chiều cao/ngày sinh). */
export const useTdeeEstimate = (enabled: boolean) =>
  useQuery({
    queryKey: onboardingKeys.estimate,
    queryFn: () => onboardingService.estimate(),
    enabled,
    staleTime: 0,
  })

/**
 * Câu Prior Weight do BE dựng (số ngưỡng + đơn vị hiển thị). Khoá theo cân nặng + đơn vị: đổi đơn vị (kg ↔ lb) thì gọi lại với đơn vị mới. `weightKg` bỏ trống =
 * BE dùng cân nặng mới nhất. 400 (chưa có cân nặng) không thử lại.
 */
export const usePriorWeightQuestion = (
  params: { weightKg?: number; unit: 'kg' | 'lb' },
  enabled: boolean
) =>
  useQuery({
    queryKey: ['onboarding', 'prior-weight-question', params.weightKg ?? null, params.unit],
    queryFn: async () => {
      const question = await onboardingService.priorWeightQuestion(params)
      if (!question) throw new Error('Empty prior weight question')
      return question
    },
    enabled,
    staleTime: 0,
    retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
  })

/** Xem trước goal/program: giữ kết quả cũ trong lúc tính lại để số không nháy về trống khi kéo thanh trượt. */
export const useProgramPreview = (request: PreviewRequest | null) =>
  useQuery({
    queryKey: request ? onboardingKeys.preview(request) : ['onboarding', 'preview', 'idle'],
    queryFn: () => onboardingService.preview(request as PreviewRequest), // enabled chỉ bật khi request khác null
    enabled: request !== null,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    // 400 (vd. Calorie Shift không khả thi) gửi lại y nguyên vẫn 400: không thử lại, hiện ngay cho người dùng sửa
    retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
  })

export const useCreateOnboardingProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProgramRequest) => programService.create(payload),
    onSuccess: () => {
      void invalidateOnboardingData(queryClient)
    },
  })
}

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: onboardingService.complete,
    // Chờ state mới về rồi mới cho rời wizard, nếu không guard thấy isRequired cũ và đá ngược lại
    onSuccess: () => invalidateOnboardingData(queryClient),
  })
}
