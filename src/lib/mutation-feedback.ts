import { toast } from 'sonner'
import { getFormErrorMessage } from '@/features/auth/auth.utils'
import { logger } from '@/lib/api'

/**
 * Lỗi của một thao tác xoá / thao tác không có form để hiện lỗi inline: ghi log VÀ báo user bằng toast (tiêu đề cụ thể + lý do của BE), thay vì thất bại
 * im lặng. Form có chỗ hiện lỗi inline (UI.md mục 10) KHÔNG dùng hàm này.
 */
export function reportMutationError(error: unknown, title: string) {
  logger.error(error)
  toast.error(title, { description: getFormErrorMessage(error) })
}
