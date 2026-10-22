import { goalPercent, goalStatus, type NutrientGoal } from './goal-progress'
import { cn } from '@/lib/utils'

interface GoalPercentProps {
  /** floor / target / ceiling hiệu lực. */
  readonly goal: NutrientGoal | null | undefined
  /** null = chưa có dữ liệu chất này. */
  readonly consumed: number | null
  /** Chữ khi chưa có phần trăm: "No Target" (chưa có mục tiêu) hoặc rỗng (có mục tiêu nhưng chưa có số). */
  readonly fallback?: string
  readonly className?: string
}

/**
 * Phần trăm so với mốc chính (một ô của hàng "tên / lượng / %"). Vượt target chỉ là thông tin ("112%") nên giữ tông trung tính; chỉ vượt
 * TRẦN (giới hạn thật) mới là cảnh báo: chữ destructive kèm chữ ẩn cho trình đọc màn hình, để không chỉ dựa vào màu.
 */
export function GoalPercent({ goal, consumed, fallback = '', className }: GoalPercentProps) {
  const percent = goalPercent(goal, consumed)
  const overCeiling = goalStatus(goal, consumed) === 'overCeiling'
  return (
    <span
      className={cn(
        'tabular-nums',
        overCeiling ? 'text-destructive' : 'text-muted-foreground',
        className
      )}
    >
      {percent === null ? fallback : `${percent}%`}
      {overCeiling && <span className="sr-only"> over the limit</span>}
    </span>
  )
}
