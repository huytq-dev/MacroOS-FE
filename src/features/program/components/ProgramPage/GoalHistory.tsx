import { Check, Hourglass, X } from 'lucide-react'
import { CollapseItem } from '@/components/shared/CollapseItem'
import { useUnits } from '@/features/users/hooks/use-units'
import { useExitingList } from '@/hooks/use-exiting-list'
import { formatDate } from '@/lib/date'
import type { GoalHistoryItem } from '../../types/program.types'
import { goalShortOf } from '../../utils/goal-display'

interface GoalHistoryProps {
  readonly items: readonly GoalHistoryItem[]
}

/** Mục "Goal History" của tab Strategy: mỗi goal một thẻ (khoảng ngày, cân, loại goal, đồng hồ cát khi đang chạy / dấu tick khi xong). */
export function GoalHistory({ items }: GoalHistoryProps) {
  const rows = useExitingList(items, (item) => item.id)
  const { weight } = useUnits()
  if (rows.length === 0) return null
  return (
    <section aria-labelledby="goal-history">
      <h2 id="goal-history" className="mb-3 text-xl font-bold">
        Goal History
      </h2>
      <ul>
        {rows.map(({ item, key, entering, leaving }) => (
          <CollapseItem key={key} gap entering={entering} leaving={leaving}>
            <div className="bg-card flex items-center justify-between gap-3 rounded-2xl px-4 py-4">
              <div className="min-w-0">
                <p className="text-muted-foreground text-base">
                  {formatDate(item.startDate)} - {item.endDate ? formatDate(item.endDate) : 'Now'}
                </p>
                <p className="text-xl font-medium tabular-nums">
                  {weight.text(item.startWeightKg)}
                </p>
              </div>
              <p className="text-muted-foreground flex shrink-0 items-center gap-2 text-base">
                {goalShortOf(item.goalType)}
                {item.status === 'Active' ? (
                  <Hourglass
                    aria-label="In progress"
                    fill="currentColor"
                    className="text-foreground size-6"
                  />
                ) : item.status === 'Achieved' ? (
                  <Check aria-label="Achieved" className="text-foreground size-6" />
                ) : (
                  <X aria-label={item.status} className="size-6" />
                )}
              </p>
            </div>
          </CollapseItem>
        ))}
      </ul>
    </section>
  )
}
