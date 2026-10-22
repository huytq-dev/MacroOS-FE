'use client'

import { ErrorState } from '@/components/shared/ErrorState'
import { cn } from '@/lib/utils'

const ERROR = new Error('The BE could not rebuild this data')

/**
 * Khi BE dựng lại số dẫn xuất THẤT BẠI (`state = Failed`): ErrorState có sẵn, gọn, nằm trong khối của thẻ / trang (số thô vẫn xem được), nút "Try again" gọi
 * `POST /derived-data/retry`. Không có thành phần mới.
 */
export function DerivedFailed({
  onRetry,
  isRetrying,
  className,
}: {
  readonly onRetry: () => void
  readonly isRetrying: boolean
  readonly className?: string
}) {
  return (
    <div className={cn('bg-card rounded-2xl', className)}>
      <ErrorState
        error={ERROR}
        kind="server"
        variant="inline"
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    </div>
  )
}
