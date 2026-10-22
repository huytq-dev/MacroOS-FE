'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { derivedDataService } from '../services/derived-data.service'
import {
  derivedStatusKey,
  gateOf,
  pollInterval,
  readDerivedStatus,
  retryDerived,
  type DerivedStatus,
  type StatusClient,
} from '../derived-data.utils'

/**
 * Trạng thái dựng lại số dẫn xuất của BE, MỘT truy vấn dùng chung (cùng khoá) cho mọi màn: đọc lúc mở trang (kể cả sau khi tải lại hoặc ở tab khác), hỏi lại
 * mỗi ~4 s khi Updating (ngừng khi trang ẩn, tiếp tục khi quay lại), và làm mới số dẫn xuất đúng một lần khi xong.
 */
export const derivedStatusOptions = (client: StatusClient) => ({
  queryKey: derivedStatusKey,
  queryFn: () => readDerivedStatus(client, derivedDataService),
  staleTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  refetchIntervalInBackground: false,
  refetchInterval: (query: { state: { data: DerivedStatus | undefined } }) =>
    pollInterval(query.state.data),
})

/**
 * Màn dẫn xuất (Expenditure, Energy Balance, Goal Progress, Weight Trend và thẻ / ô Dashboard của chúng) hỏi hook này: `ready` = vẽ số bình thường,
 * `updating` = khung xám có sẵn, `failed` = ErrorState trong khối với "Try again".
 */
export function useDerivedGate() {
  const client = useQueryClient()
  const status = useQuery(derivedStatusOptions(client))
  const retry = useMutation({
    mutationFn: () => retryDerived(client, derivedDataService),
    // Đọc lại trạng thái thật sau khi thử lại (thành công hay lỗi): nguồn sự thật vẫn là GET status
    onSettled: () => void client.invalidateQueries({ queryKey: derivedStatusKey }),
  })
  return {
    gate: gateOf(status.data),
    retry: () => retry.mutate(),
    isRetrying: retry.isPending,
  }
}
