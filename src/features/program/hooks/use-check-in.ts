'use client'

import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { invalidateLogData, invalidateTargetData } from '@/features/food-log/hooks/use-food-log'
import {
  applyDerivedState,
  derivedStatusKey,
  gateOf,
  type DerivedStatus,
} from '@/features/derived-data/derived-data.utils'
import { useDerivedGate } from '@/features/derived-data/hooks/use-derived-data'
import { logger } from '@/lib/api'
import { checkInService } from '../services/check-in.service'
import type { CheckInSession, SetCheckInModulesRequest } from '../types/check-in.types'
import {
  acceptBlockOfError,
  checkInAcceptGate,
  MAX_GATE_SYNCS,
  previewPollInterval,
} from '../utils/check-in-gate'

export const checkInKeys = { session: ['check-in', 'session'] as const }

/**
 * Hub check-in dùng chung cho hub và mọi module: một request gộp module + 7 ngày kcal + preview đề xuất. Chỉ tải ở các route check-in.
 * `pollBlockedPreview`: CHỈ trang có nút Accept (module Program Update, nơi cổng được dùng và trạng thái sống được theo dõi) bật — hub không đọc trạng thái
 * dẫn xuất nên không bao giờ hỏi lại.
 */
export const useCheckInSession = ({ pollBlockedPreview = false } = {}) => {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: checkInKeys.session,
    queryFn: async () => {
      const session = await checkInService.getSession()
      if (!session) throw new Error('Empty check-in session')
      return session
    },
    staleTime: 0,
    // G6: preview chặn Accept mà trạng thái sống không tự lo được (status chưa đọc được, hoặc đã Ready mà lần tải lại preview hỏng) → hỏi lại preview mỗi
    // POLL_MS cho tới khi mở; dừng khi trang ẩn. Failed không hỏi (cần "Try again"). Không có trường hợp nào tự Accept
    refetchInterval: pollBlockedPreview
      ? (query) => {
          const status = queryClient.getQueryData<DerivedStatus>(derivedStatusKey)
          return previewPollInterval(query.state.data?.preview, {
            gate: gateOf(status),
            known: status !== undefined,
          })
        }
      : false,
  })
}

/** Đặt tập ngày log chưa đủ: BE dựng lại expenditure rồi trả luôn session mới → ghi thẳng vào cache, không refetch. */
export const useSetIncompleteDays = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dates: string[]) => checkInService.setIncompleteDays(dates),
    onSuccess: (session) => {
      if (session) queryClient.setQueryData(checkInKeys.session, session)
      // BE dựng lại expenditure từ tập ngày chưa đủ và đổi cờ `isIncomplete` của các ngày: nhật ký, nutrients, Nutrition Overview, Expenditure và
      // Energy Balance đều phải đọc lại (`invalidateLogData`)
      invalidateLogData(queryClient)
    },
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't save your selection")
    },
  })
}

/** Lưu cờ module (đã xem Introduction, tắt Partial Logging); xong thì tải lại session để danh sách module đúng. */
export const useSetCheckInModules = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetCheckInModulesRequest) => checkInService.setModules(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: checkInKeys.session }),
    onError: (error) => {
      logger.error(error)
      toast.error("Couldn't save your modules")
    },
  })
}

/** Accept / Reject đổi target tuần → làm mới program, goal, check-in và mọi số hiển thị theo target (`invalidateTargetData`). Lặp cùng quyết định là an toàn (BE trả Id cũ). */
const useDecision = (decide: () => Promise<unknown>) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: decide,
    onSuccess: () => invalidateTargetData(queryClient),
    onError: (error) => {
      // G6: BE từ chối Accept vì dữ liệu dẫn xuất chưa Ready (409, không ghi gì) — kể cả khi nút đang mở. Không toast lỗi chung: đưa trạng thái BE vào cache
      // status (Updating → vòng hỏi; Failed → Retry) và tải lại preview; nút tự khoá qua `useCheckInAcceptGate`
      const blocked = acceptBlockOfError(error)
      if (blocked) {
        applyDerivedState(queryClient, blocked === 'failed' ? 'Failed' : 'Updating')
        void queryClient.invalidateQueries({ queryKey: checkInKeys.session })
        return
      }
      logger.error(error)
      toast.error("Couldn't update your program")
    },
  })
}

/**
 * Cổng của Accept (và "Done", cũng là Accept): khoá khi dữ liệu dẫn xuất Updating / Failed theo trạng thái sống (cache dùng chung, đọc lúc mở trang, hỏi lại
 * khi Updating) và lý do chặn trong preview. Hai nguồn lệch nhau thì đọc lại nguồn cũ hơn (tối đa `MAX_GATE_SYNCS` lần). Ready thì chỉ mở nút, KHÔNG tự Accept.
 */
export function useCheckInAcceptGate(
  session: Pick<ReturnType<typeof useCheckInSession>, 'dataUpdatedAt' | 'isFetching'> & {
    readonly data?: CheckInSession
  },
  // Chỉ module có nút Accept (Program Update) đọc lại các nguồn; module khác chỉ cần đọc cổng (không gửi request)
  active = true
) {
  const queryClient = useQueryClient()
  const derived = useDerivedGate()
  const { gate, sync } = checkInAcceptGate(
    session.data?.preview,
    session.dataUpdatedAt,
    derived,
    session.isFetching
  )
  const syncs = useRef(0)
  const target = sync === 'refetch-preview' ? session.isFetching : derived.isFetching
  useEffect(() => {
    if (!active || sync === 'none') {
      syncs.current = 0
      return
    }
    // Nguồn cần đọc lại đang được tải (vd. Ready vừa làm mới preview qua DERIVED_KEYS): chờ kết quả, không gửi thêm một request rồi huỷ request đang chạy
    if (target || syncs.current >= MAX_GATE_SYNCS) return
    syncs.current += 1
    const queryKey = sync === 'refetch-preview' ? checkInKeys.session : derivedStatusKey
    void queryClient.invalidateQueries({ queryKey })
  }, [active, sync, target, session.dataUpdatedAt, derived.updatedAt, queryClient])
  return { gate, retry: derived.retry, isRetrying: derived.isRetrying }
}

export const useAcceptCheckIn = () => useDecision(() => checkInService.accept())
export const useRejectCheckIn = () => useDecision(() => checkInService.reject())
