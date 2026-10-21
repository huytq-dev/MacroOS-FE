import { ArrowUp } from 'lucide-react'
import type { NutrientInfo } from '../nutrient-detail.utils'
import { NutrientGoalBar } from '@/features/nutrition/NutrientGoalBar'
import { goalProgress, type NutrientGoal } from '@/features/nutrition/goal-progress'

/** Mục tiêu và lượng ăn MINH HOẠ (không phải số của người dùng): đủ cả ba mốc, đang giữa floor và target. */
const SAMPLE_GOAL: NutrientGoal = { floor: 80, target: 120, ceiling: 160 }
const SAMPLE_CONSUMED = 105

/**
 * Hình "Anatomy of a Nutrient Goal": CHÍNH `NutrientGoalBar` (cùng hình học `goalProgress` với mọi thanh khác) vẽ một mục tiêu mẫu có đủ
 * floor / target / ceiling theo màu của chất đang xem, kèm ba mũi tên Floor / Target / Ceiling đặt đúng vị trí thật của từng mốc.
 */
export function GoalAnatomy({ info }: { readonly info: NutrientInfo }) {
  const progress = goalProgress(SAMPLE_GOAL, SAMPLE_CONSUMED, 'tile')
  const marks = [
    { label: 'Floor', at: progress.floorAt },
    { label: 'Target', at: progress.targetAt },
    { label: 'Ceiling', at: progress.ceilingAt },
  ] as const
  return (
    <div aria-hidden="true" className="px-1">
      <NutrientGoalBar
        goal={SAMPLE_GOAL}
        consumed={SAMPLE_CONSUMED}
        tone={info.tone}
        layout="tile"
      />
      <div className="relative mt-2 h-12">
        {marks.map((mark) =>
          mark.at === null ? null : (
            <span
              key={mark.label}
              className="text-muted-foreground absolute flex -translate-x-1/2 flex-col items-center text-base"
              style={{ left: `${mark.at * 100}%` }}
            >
              <ArrowUp className="size-4" />
              {mark.label}
            </span>
          )
        )}
      </div>
    </div>
  )
}
