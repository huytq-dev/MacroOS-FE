import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { getApiError } from '@/lib/api'

/** `data.reasonCode` của 400 khi đổi khẩu phần của dòng log cũ (log trước khi BE lưu snapshot khẩu phần): BE không xác minh được khối lượng gốc nên từ chối. */
const LEGACY_SERVING = 'LEGACY_SERVING_SNAPSHOT_MISSING'

const LEGACY_SERVING_MESSAGE =
  "This entry was logged before serving details were stored, so its original weight can't be verified and its serving can't be changed. You can still change the quantity, meal and time (switch the serving back to what it was), or delete it and log the food again."

/** Lỗi lưu dòng log đã sửa → câu hiển thị trong màn sửa; lỗi khác giữ câu chung. Chỉ phản ứng với lỗi BE, FE không tự kiểm dòng cũ. */
export function entryEditErrorOf(error: unknown): string {
  const apiError = getApiError(error)
  const data = apiError?.data
  if (
    apiError?.statusCode === 400 &&
    typeof data === 'object' &&
    data !== null &&
    (data as { reasonCode?: unknown }).reasonCode === LEGACY_SERVING
  )
    return LEGACY_SERVING_MESSAGE
  return getFormErrorMessage(error)
}
