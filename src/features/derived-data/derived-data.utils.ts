import type { QueryClient } from '@tanstack/react-query'

/**
 * Trạng thái dựng lại số liệu DẪN XUẤT của BE (expenditure, energy balance, goal progress, tổng hợp dinh dưỡng) sau khi ghi. Ghi xong BE đã dựng đồng bộ
 * cửa sổ gần nhất; chỉ khi quá ngân sách / lỗi / khoá bận thì có job nền (lưu trước khi trả lời ghi). `GET /derived-data/status` cho biết: Ready = số đã mới,
 * Updating = đang dựng (số cũ KHÔNG được hiện như số mới), Failed = BE dựng lỗi thật (khác lỗi mạng khi gọi status).
 */
export type DerivedState = 'Ready' | 'Updating' | 'Failed'

export interface DerivedStatus {
  readonly state: DerivedState
  readonly fromDate: string | null
  readonly toDate: string | null
  readonly attempt: number
  readonly updatedAt: string | null
}

/** Màn hiện gì: ready = số bình thường, updating = khung xám có sẵn, failed = ErrorState trong khối. */
export type DerivedGate = 'ready' | 'updating' | 'failed'

export const derivedStatusKey = ['derived-data', 'status'] as const

/** Hỏi lại trạng thái mỗi chừng này khi đang Updating (3 – 5 s); trang ẩn thì TanStack ngừng, quay lại thì tiếp tục. */
export const POLL_MS = 4000

/**
 * Các truy vấn mang số dẫn xuất: làm mới MỘT lần khi BE xong (Updating / Failed → Ready). Không gồm nhật ký món, cân thô, danh sách (BE ghi đồng bộ,
 * không cần chờ).
 */
export const DERIVED_KEYS = [
  ['expenditure'],
  ['energy-balance'],
  ['goals'],
  ['weights', 'trend'],
  ['nutrients'],
  ['nutrition-overview'],
  ['check-in'],
] as const

/** Chu kỳ hỏi lại: chỉ khi đang Updating. */
export const pollInterval = (status: DerivedStatus | undefined): number | false =>
  status?.state === 'Updating' ? POLL_MS : false

/**
 * Trạng thái màn từ lần đọc status CUỐI THÀNH CÔNG. Lỗi mạng khi gọi status giữ nguyên lần đọc cuối (không phải Failed); chưa đọc được lần nào thì hiện
 * bình thường (lỗi của từng truy vấn tự hiện theo cách thường).
 */
export const gateOf = (status: DerivedStatus | undefined): DerivedGate =>
  status?.state === 'Updating' ? 'updating' : status?.state === 'Failed' ? 'failed' : 'ready'

/** Số dẫn xuất vừa mới xong (Updating / Failed → Ready): làm mới các truy vấn dẫn xuất đúng một lần. */
export function onStatusChange(
  client: Pick<QueryClient, 'invalidateQueries'>,
  previous: DerivedStatus | undefined,
  next: DerivedStatus
) {
  if (next.state !== 'Ready') return
  if (previous?.state !== 'Updating' && previous?.state !== 'Failed') return
  for (const queryKey of DERIVED_KEYS) void client.invalidateQueries({ queryKey })
}

/** Sau mỗi lần ghi ảnh hưởng số dẫn xuất: đọc status MỘT lần (không có người nghe thì đánh dấu cũ, màn dẫn xuất tới sau sẽ đọc lúc mở). */
export function refreshDerivedStatus(client: Pick<QueryClient, 'invalidateQueries'>) {
  void client.invalidateQueries({ queryKey: derivedStatusKey })
}

interface DerivedDataApi {
  readonly status: () => Promise<DerivedStatus | null>
  readonly retry: () => Promise<DerivedStatus | null>
}

export type StatusClient = Pick<QueryClient, 'invalidateQueries' | 'getQueryData' | 'setQueryData'>

/** Đọc status và làm mới số dẫn xuất khi vừa xong; một nơi dùng chung cho mọi màn (cùng khoá nên một vòng hỏi cho cả app / mọi tab của trang). */
export async function readDerivedStatus(client: StatusClient, api: DerivedDataApi) {
  const next = await api.status()
  if (!next) throw new Error('Empty derived-data status')
  onStatusChange(client, client.getQueryData<DerivedStatus>(derivedStatusKey), next)
  return next
}

/**
 * "Try again": POST retry rồi lấy NGUYÊN trạng thái BE trả (thường Updating → vòng hỏi lại chạy tiếp). Retry lỗi thì ném ra và giữ nguyên Failed (màn không
 * quay mãi, nút vẫn bấm lại được).
 */
export async function retryDerived(client: StatusClient, api: DerivedDataApi) {
  const previous = client.getQueryData<DerivedStatus>(derivedStatusKey)
  const next = await api.retry()
  if (!next) throw new Error('Empty derived-data status')
  client.setQueryData(derivedStatusKey, next)
  onStatusChange(client, previous, next)
  return next
}
