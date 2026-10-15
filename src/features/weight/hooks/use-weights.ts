'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { weightService } from '../services/weight.service'
import type { UpsertWeightRequest } from '../types/weight.types'
import { getErrorMessage, isSystemError, logger } from '@/lib/api'

export const weightKeys = {
  all: ['weights'] as const,
  range: (from: string, to: string) => ['weights', from, to] as const,
}

export const useWeights = (from: string | null, to: string | null) =>
  useQuery({
    queryKey: weightKeys.range(from ?? '', to ?? ''),
    queryFn: () => weightService.list(from ?? '', to ?? ''),
    enabled: Boolean(from && to),
  })

const useWeightMutation = <TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>, successMessage: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: weightKeys.all })
    },
    onError: (error) => {
      logger.error(error)
      if (!isSystemError(error)) toast.error(getErrorMessage(error))
    },
  })
}

export const useUpsertWeight = () =>
  useWeightMutation((payload: UpsertWeightRequest) => weightService.upsert(payload), 'Đã ghi cân nặng')
export const useDeleteWeight = () => useWeightMutation((logDate: string) => weightService.remove(logDate), 'Đã xoá')
