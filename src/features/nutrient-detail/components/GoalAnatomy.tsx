import { ArrowUp } from 'lucide-react'
import type { NutrientInfo } from '../nutrient-detail.utils'
import { NutrientGoalBar } from '@/features/nutrition/NutrientGoalBar'
import { goalProgress, type NutrientGoal } from '@/features/nutrition/goal-progress'

/**
 * Mục tiêu và lượng ăn MINH HOẠ (không phải số của người dùng): một mục tiêu Range có đủ ba mốc, trần gần (≤ 2 × target) nên được vẽ.
 * Vị trí do `goalScaleMax` tính (thang = ceiling × 1.15 = 166.75 → floor ≈ 0.36, target ≈ 0.60, ceiling ≈ 0.87), phần đã ăn ≈ 0.72
 * (đã qua target, chưa tới ceiling) — không có vị trí nào được gán tay.
 */
const SAMPLE_GOAL: NutrientGoal = { floor: 60, target: 100, ceiling: 145, goalKind: 'Range' }
const SAMPLE_CONSUMED = 120

/**
 * Hình "Anatomy of a Nutrient Goal": CHÍNH `NutrientGoalBar` (cùng hình học `goalProgress` với mọi thanh khác) vẽ MỘT VÍ DỤ có đủ
 * floor / target / ceiling theo màu của chất đang xem — dải tối từ floor tới ceiling, phần sau ceiling là nền xám — kèm ba mũi tên
 * Floor / Target / Ceiling đặt đúng vị trí thật của từng mốc.
 */
export function GoalAnatomy({ info }: { readonly info: NutrientInfo }) {
  const progress = goalProgress(SAMPLE_GOAL, SAMPLE_CONSUMED)
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
