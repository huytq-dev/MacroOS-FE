'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { programService } from '../services/program.service'
import type { ProgramType } from '@/config/enums'
import type { CreateProgramRequest, UpdateProgramGoalRequest } from '../types/program.types'
import { invalidateTargetData } from '@/features/food-log/hooks/use-food-log'
import { logger } from '@/lib/api'

export const programKeys = { current: ['program', 'current'] as const }

/** 404 = chưa có program (không phải lỗi) → data null. */
export const useCurrentProgram = () =>
  useQuery({
    queryKey: programKeys.current,
    queryFn: async () => {
      try {
        const program = await programService.getCurrent()
        if (!program) return null
        // BE cũ chưa trả hai trường này: coi như chưa có thay vì để undefined lọt vào UI
        return {
          ...program,
          targetWeightKg: program.targetWeightKg ?? null,
          checkInDueInDays: program.checkInDueInDays ?? null,
          checkInDue: program.checkInDue ?? false,
        }
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) return null
        throw error
      }
    },
    staleTime: 60 * 1000,
  })

const useProgramMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      // Target đổi theo program ở mọi nơi (nhật ký, Dashboard, Energy Balance, Expenditure, Overview): làm mới chung một danh sách
      invalidateTargetData(queryClient)
    },
    onError: (error) => {
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở dialog/trang (UI.md mục 10), không toast
    },
  })
}

/** Số liệu nền của wizard New Program (cân nặng, sàn calo, trần nhập); tải một lần khi vào wizard. */
export const useProgramSetup = () =>
  useQuery({
    queryKey: ['program', 'setup'],
    queryFn: async () => {
      const setup = await programService.setup()
      if (!setup) throw new Error('Empty setup response')
      return setup
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

/** Xem trước program theo lựa chọn của wizard (không ghi DB): bảy ngày + số cho màn Review và khởi tạo editor. */
export const usePreviewProgram = () =>
  useMutation({
    mutationFn: async (payload: CreateProgramRequest) => {
      const preview = await programService.preview(payload)
      if (!preview) throw new Error('Empty preview response')
      return preview
    },
    onError: (error) => logger.error(error),
  })

export const useCreateProgram = () =>
  useProgramMutation(
    (payload: CreateProgramRequest) => programService.create(payload),
    'Program created'
  )
export const useUpdateProgramGoal = () =>
  useProgramMutation(
    (payload: UpdateProgramGoalRequest) => programService.updateGoal(payload),
    'Goal updated'
  )
export const useChangeProgramStyle = () =>
  useProgramMutation(
    (programType: ProgramType) => programService.changeStyle(programType),
    'Program style changed'
  )
export const useSetManualExpenditure = () =>
  useProgramMutation(
    (tdeeKcal: number) => programService.setManualExpenditure(tdeeKcal),
    'Starting TDEE set'
  )
/** Lịch sử goal cho mục Goal History; chỉ tải khi đã có program. */
export const useGoalHistory = (enabled: boolean) =>
  useQuery({
    queryKey: ['goals', 'history'],
    queryFn: () => programService.goalHistory(),
    enabled,
    staleTime: 60 * 1000,
    // Mục phụ: lỗi thì ẩn Goal History, không thử lại nhiều lần
    retry: false,
  })

export const useEndProgram = () => useProgramMutation(() => programService.end(), 'Program ended')
