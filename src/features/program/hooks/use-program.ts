'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { programService } from '../services/program.service'
import type { ProgramType } from '@/config/enums'
import type { CreateProgramRequest, UpdateProgramGoalRequest } from '../types/program.types'
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
      void queryClient.invalidateQueries({ queryKey: programKeys.current })
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
    onError: (error) => {
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở dialog/trang (UI.md mục 10), không toast
    },
  })
}

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

export const useUpdateGoalTarget = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (targetWeightKg: number | null) => programService.updateGoalTarget(targetWeightKg),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['goals'] }),
    onError: (error) => logger.error(error),
  })
}
export const useEndProgram = () => useProgramMutation(() => programService.end(), 'Program ended')
