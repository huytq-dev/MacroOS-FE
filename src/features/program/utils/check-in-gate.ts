import { POLL_MS, type DerivedGate } from '@/features/derived-data/derived-data.utils'
import type { CheckInPreview } from '../types/check-in.types'

/**
 * G6 (user duyệt): Accept check-in dùng TDEE trong snapshot nên BE chặn khi dữ liệu dẫn xuất chưa Ready (`POST /check-ins/accept` → 409, không ghi gì).
 * "Done" (không có đề xuất) cũng là Accept nên bị chặn như vậy; Decline (Reject) luôn được phép.
 */
export const ACCEPT_BLOCK = {
  updating: 'DERIVED_DATA_UPDATING',
  failed: 'DERIVED_DATA_FAILED',
} as const

/** open = Accept được bấm; updating = đang tính lại (khoá, chờ); failed = tính lỗi (khoá, có "Try again" dựng lại). */
export type AcceptGate = 'open' | 'updating' | 'failed'

/** Mã lý do của BE → cổng. null = mở; mã lạ = đóng như Updating (giống `CheckInGate` của BE: không mở nhầm). */
export const gateOfReason = (reason: string | null | undefined): AcceptGate =>
  reason == null || reason === '' ? 'open' : reason === ACCEPT_BLOCK.failed ? 'failed' : 'updating'

interface ErrorLike {
  readonly response?: {
    readonly status?: number
    readonly data?: {
      readonly errors?: Record<string, readonly string[] | undefined> | null
    } | null
  }
}

/**
 * 409 của Accept vì dữ liệu dẫn xuất chưa Ready (`errors.reasonCode = [DERIVED_DATA_*]`) → cổng; mọi lỗi khác (kể cả 409 "đã quyết định khác") → null để
 * giữ cách báo lỗi thường. BE là nguồn sự thật: nút có đang mở vẫn có thể nhận 409 này.
 */
export function acceptBlockOfError(error: unknown): Exclude<AcceptGate, 'open'> | null {
  const response = (error as ErrorLike | null | undefined)?.response
  if (response?.status !== 409) return null
  const errors = response.data?.errors ?? {}
  const key = Object.keys(errors).find((name) => name.toLowerCase() === 'reasoncode')
  const code = key ? errors[key]?.[0] : undefined
  if (code === ACCEPT_BLOCK.failed) return 'failed'
  if (code === ACCEPT_BLOCK.updating) return 'updating'
  return null
}

/** Trạng thái dẫn xuất sống (cache `GET /derived-data/status` dùng chung, cùng header của mọi lần ghi). */
export interface LiveDerivedState {
  readonly gate: DerivedGate
  /** false = chưa đọc được lần nào (chỉ có preview để dựa vào). */
  readonly known: boolean
  /** ms epoch của lần cập nhật cache cuối. */
  readonly updatedAt: number
  /** Ready đang chờ lượt làm mới (hoặc lần đọc lại) của chính nó: 'updating' tạm thời, tự hết — không phải status cũ cần đọc lại. */
  readonly settling?: boolean
}

/** Hai nguồn lệch nhau thì đọc lại nguồn có thể cũ MỘT lần: preview (`GET /check-ins/session`) hoặc status. */
export type GateSync = 'none' | 'refetch-preview' | 'read-status'

const SEVERITY: Readonly<Record<AcceptGate, number>> = { open: 0, updating: 1, failed: 2 }

const liveGate = (live: LiveDerivedState): AcceptGate =>
  live.gate === 'ready' ? 'open' : live.gate

/**
 * Cổng Accept từ hai nguồn: lý do chặn trong preview (BE chụp lúc dựng preview) và trạng thái sống. Lệch nhau thì lấy cái NGHIÊM hơn (không mở khi còn
 * nghi ngờ) và báo cần đọc lại nguồn có thể cũ:
 * - status mới hơn và nhẹ hơn (vd. vừa Ready) → preview cũ → tải lại preview (số đề xuất mới); KHÔNG tự Accept;
 * - status mới hơn và nặng hơn (vd. một lần ghi mới đang Updating) → giữ khoá; khi Ready, DERIVED_KEYS tải lại preview;
 * - preview mới hơn → status cũ → đọc lại status (Updating thì vòng hỏi chạy, Failed thì có Retry).
 */
export function checkInAcceptGate(
  preview: Pick<CheckInPreview, 'acceptBlockedReason'> | null | undefined,
  previewUpdatedAt: number,
  live: LiveDerivedState,
  /** Preview đang được tải lại (vd. mở lại module với preview trong bộ nhớ đệm từ trước một lần ghi): chưa phải đề xuất cuối → không mở Accept. */
  previewRefreshing = false
): { readonly gate: AcceptGate; readonly sync: GateSync } {
  const result = gateOfSources(preview, previewUpdatedAt, live)
  return previewRefreshing && result.gate === 'open' ? { ...result, gate: 'updating' } : result
}

function gateOfSources(
  preview: Pick<CheckInPreview, 'acceptBlockedReason'> | null | undefined,
  previewUpdatedAt: number,
  live: LiveDerivedState
): { readonly gate: AcceptGate; readonly sync: GateSync } {
  const fromPreview = gateOfReason(preview?.acceptBlockedReason)
  if (!live.known) return { gate: fromPreview, sync: 'none' }
  const fromLive = liveGate(live)
  if (!preview || fromLive === fromPreview) return { gate: fromLive, sync: 'none' }
  const liveNewer = live.updatedAt >= previewUpdatedAt
  // Một nguồn mở, một nguồn khoá → khoá. Cả hai đều khoá (Updating vs Failed) → hiện nguồn MỚI hơn: vừa "Try again" thì status Updating mới hơn preview
  // Failed cũ, nên hiện Updating (không còn nút Try again thứ hai); Accept khoá trong mọi trường hợp
  const gate =
    fromLive !== 'open' && fromPreview !== 'open'
      ? liveNewer
        ? fromLive
        : fromPreview
      : SEVERITY[fromLive] > SEVERITY[fromPreview]
        ? fromLive
        : fromPreview
  // Status đang tự làm mới (`settling`): nó sẽ đổi trong nhịp tới, đọc thêm chỉ tốn request (vd. preview về trước khi lượt làm mới bỏ cờ)
  if (!liveNewer) return { gate, sync: live.settling ? 'none' : 'read-status' }
  return { gate, sync: SEVERITY[fromLive] < SEVERITY[fromPreview] ? 'refetch-preview' : 'none' }
}

/**
 * Chu kỳ tải lại preview: chỉ khi preview đang chặn Accept mà trạng thái sống KHÔNG tự lo được — chưa đọc được status (lỗi mạng / 5xx), hoặc status đã Ready
 * mà lần tải lại preview vừa rồi hỏng. Status Updating thì vòng hỏi status lo (Ready → DERIVED_KEYS tải lại preview); Failed thì chờ user bấm "Try again".
 * Không bao giờ hỏi khi Accept đang mở.
 */
export function previewPollInterval(
  preview: Pick<CheckInPreview, 'acceptBlockedReason'> | null | undefined,
  live: Pick<LiveDerivedState, 'gate' | 'known'>
): number | false {
  const fromPreview = gateOfReason(preview?.acceptBlockedReason)
  if (fromPreview === 'open') return false
  const liveReady = live.known && live.gate === 'ready'
  // Preview Failed không tự hết (BE giữ Failed tới khi POST /derived-data/retry): chỉ hỏi lại khi trạng thái sống ĐÃ Ready (vd. sau "Try again" mà lần tải
  // lại preview hỏng) — còn lại trang hiện "Try again", hỏi lại chỉ tốn request
  if (fromPreview === 'failed') return liveReady ? POLL_MS : false
  // Preview Updating: chỉ khi trạng thái sống đang Updating mới không cần hỏi (vòng hỏi status tự lo, Ready → DERIVED_KEYS tải lại preview). Sống Failed cũ
  // (vd. đã Retry ở thiết bị khác) không tự đổi, nên vẫn hỏi preview: nó sẽ thành Failed (hiện "Try again") hoặc mở
  if (live.known && live.gate === 'updating') return false
  return POLL_MS
}

/** Số lần đọc lại tối đa cho một lần lệch: BE tự mâu thuẫn thì dừng (giữ khoá) thay vì đọc qua đọc lại mãi. */
export const MAX_GATE_SYNCS = 2
