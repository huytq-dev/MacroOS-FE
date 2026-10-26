'use client'

import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

const derivedRetryKey = ['derived-data', 'retry'] as const

/**
 * Trạng thái dựng lại số dẫn xuất của BE, MỘT truy vấn dùng chung (cùng khoá) cho mọi màn: đọc lúc mở trang (kể cả sau khi tải lại hoặc ở tab khác), hỏi lại
 * mỗi ~4 s khi Updating (ngừng khi trang ẩn, tiếp tục khi quay lại), và làm mới số dẫn xuất đúng một lần khi xong.
 */
export const derivedStatusOptions = (client: StatusClient) => ({
  queryKey: derivedStatusKey,
  // Không chạm `signal` của TanStack (đặt cờ cho cả truy vấn → huỷ GET đang bay khi màn cuối rời đi); lần đọc bị thay thế do readDerivedStatus tự bỏ
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
    mutationKey: derivedRetryKey,
    mutationFn: () => retryDerived(client, derivedDataService),
    // Đọc lại trạng thái thật sau khi thử lại (thành công hay lỗi): nguồn sự thật vẫn là GET status. Trả promise: nút "Try again" (`isRetrying`, khoá một Retry một lúc)
    // giữ nguyên tới khi lần đọc quyết định kết quả đã về, kể cả khi `retryDerived` bỏ qua việc ghi vì cache đã đổi trong lúc POST chờ
    onSettled: () => client.invalidateQueries({ queryKey: derivedStatusKey }),
  })
  // Một màn có nhiều nút "Try again" (mỗi ô một hook): đang thử lại ở BẤT KỲ nút nào thì mọi nút cùng khoá, không gửi POST thứ hai
  const retrying = useIsMutating({ mutationKey: derivedRetryKey }) > 0
  return {
    gate: gateOf(status.data),
    // Đã đọc được status lần nào chưa và lúc nào (so với dữ liệu khác chụp cùng trạng thái, vd. preview check-in)
    known: status.data !== undefined,
    updatedAt: status.dataUpdatedAt,
    // Ready đang chờ lượt làm mới / lần đọc lại của nó (FE tự lo, không cần đọc status thêm)
    settling: Boolean(status.data?.settling),
    isFetching: status.isFetching,
    retry: () => {
      if (client.isMutating({ mutationKey: derivedRetryKey }) === 0) retry.mutate()
    },
    isRetrying: retrying,
  }
}
