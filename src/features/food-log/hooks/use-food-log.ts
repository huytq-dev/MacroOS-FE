'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { foodLogService } from '../services/food-log.service'
import type {
  AddEntryRequest,
  AddNoteRequest,
  CopyRequest,
  DayStatus,
  QuickAddRequest,
  UpdateEntryRequest,
  UpdateNoteRequest,
} from '../types/food-log.types'
import { logger } from '@/lib/api'

export const foodLogKeys = {
  all: ['food-log'] as const,
  day: (date: string) => ['food-log', 'day', date] as const,
  week: (date: string) => ['food-log', 'week', date] as const,
}

export const useDayLog = (date: string | null) =>
  useQuery({
    queryKey: foodLogKeys.day(date ?? ''),
    queryFn: () => foodLogService.getDay(date ?? ''),
    enabled: Boolean(date),
  })

export const useWeekLog = (date: string | null) =>
  useQuery({
    queryKey: foodLogKeys.week(date ?? ''),
    queryFn: () => foodLogService.getWeek(date ?? ''),
    enabled: Boolean(date),
  })

/** Mọi thay đổi log ảnh hưởng tổng ngày của nhiều ngày (copy) → invalidate cả nhóm. */
const useLogMutation = <TVariables, TResult = unknown>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  successMessage?: string
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (successMessage) toast.success(successMessage)
      void queryClient.invalidateQueries({ queryKey: foodLogKeys.all })
    },
    onError: (error) => {
      logger.error(error)
      // lỗi nghiệp vụ hiện inline ở dialog/trang (UI.md mục 10), không toast
    },
  })
}

export const useAddEntry = () =>
  useLogMutation((payload: AddEntryRequest) => foodLogService.addEntry(payload))
export const useUpdateEntry = () =>
  useLogMutation(
    ({ id, payload }: { id: string; payload: UpdateEntryRequest }) =>
      foodLogService.updateEntry(id, payload),
    'Saved'
  )
export const useDeleteEntry = () =>
  useLogMutation((id: string) => foodLogService.deleteEntry(id), 'Food deleted')
export const useQuickAdd = () =>
  useLogMutation((payload: QuickAddRequest) => foodLogService.quickAdd(payload), 'Added')
export const useCopyLog = () =>
  useLogMutation((payload: CopyRequest) => foodLogService.copy(payload))
export const useClearDay = () =>
  useLogMutation((date: string) => foodLogService.clearDay(date), "Day's log deleted")

/** Đánh dấu ngày (Complete / Partial / Fasting / bỏ dấu); Fasting chỉ cho ngày không có món (BE trả 400 nếu có). */
export const useSetDayStatus = () =>
  useLogMutation(
    ({ date, status }: { date: string; status: DayStatus }) =>
      foodLogService.setStatus(date, status),
    'Day updated'
  )

export const useAddNote = () =>
  useLogMutation((payload: AddNoteRequest) => foodLogService.addNote(payload), 'Note added')
export const useUpdateNote = () =>
  useLogMutation(
    ({ id, payload }: { id: string; payload: UpdateNoteRequest }) =>
      foodLogService.updateNote(id, payload),
    'Note saved'
  )
export const useDeleteNote = () =>
  useLogMutation((id: string) => foodLogService.deleteNote(id), 'Note deleted')
