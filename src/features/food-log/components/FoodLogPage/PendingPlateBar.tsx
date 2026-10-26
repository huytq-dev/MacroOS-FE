'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUnits } from '@/features/users/hooks/use-units'
import type { PlateItem } from '../../types/food-log.types'

interface PendingPlateBarProps {
  readonly items: readonly PlateItem[]
  readonly isLogging: boolean
  readonly onLog: () => void
  readonly onReview: () => void
  readonly onDiscard: () => void
}

/**
 * Báo rõ "món đã chọn nhưng CHƯA ghi" khi bảng Thêm món đã đóng (nút "+" chỉ đưa món vào plate, chưa vào nhật ký): trước đây đóng bảng / rời trang là mất mà không ai nhắc,
 * user tưởng đã log. Ba nút cùng hàng cao 44px: Discard, Review (mở lại plate), Log foods (ghi ngay).
 */
export function PendingPlateBar({
  items,
  isLogging,
  onLog,
  onReview,
  onDiscard,
}: PendingPlateBarProps) {
  const { energy } = useUnits()
  const kcal = items.reduce((sum, item) => sum + item.calories, 0)
  const count = items.length
  return (
    <section
      aria-label="Foods waiting to be logged"
      className="bg-card motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 rounded-2xl p-4 motion-safe:duration-300"
    >
      <p role="status" className="text-base leading-tight font-medium">
        {count} {count === 1 ? 'food is' : 'foods are'} not logged yet
      </p>
      <p className="text-muted-foreground mt-1 text-sm tabular-nums">
        {energy.text(kcal)} on your plate · not saved to your Food Log
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-11 flex-1 rounded-full"
          disabled={isLogging}
          onClick={onDiscard}
        >
          Discard
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 flex-1 rounded-full"
          disabled={isLogging}
          onClick={onReview}
        >
          Review
        </Button>
        <Button
          type="button"
          className="h-11 flex-1 rounded-full"
          disabled={isLogging}
          aria-busy={isLogging}
          onClick={onLog}
        >
          {isLogging && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {isLogging ? 'Logging...' : 'Log foods'}
        </Button>
      </div>
    </section>
  )
}
