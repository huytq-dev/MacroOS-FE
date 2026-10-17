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
        return await programService.getCurrent()
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
export const useEndProgram = () => useProgramMutation(() => programService.end(), 'Program ended')
