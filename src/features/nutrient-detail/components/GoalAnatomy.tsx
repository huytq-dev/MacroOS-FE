import { ArrowUp } from 'lucide-react'
import type { NutrientInfo } from '../nutrient-detail.utils'
import { NutrientGoalBar } from '@/features/nutrition/NutrientGoalBar'
import { goalProgress, type NutrientGoal } from '@/features/nutrition/goal-progress'

/**
 * Mục tiêu và lượng ăn MINH HOẠ (không phải số của người dùng), đo từ ảnh "Anatomy of a Nutrient Goal" của MF: target ở 0.58 chiều dài
 * thanh, floor ≈ 0.35, ceiling ≈ 0.84 (cả ba nằm TRONG thanh), phần đã ăn ≈ 0.70 (đã qua target, chưa tới ceiling).
 */
const SAMPLE_GOAL: NutrientGoal = { floor: 60, target: 100, ceiling: 145 }
const SAMPLE_CONSUMED = 120
/** Vị trí mốc neo của hình minh hoạ (như ảnh MF); các mốc còn lại do `goalProgress` tính tuyến tính trên cùng thang. */
const SAMPLE_ANCHOR_AT = 0.58

/**
 * Hình "Anatomy of a Nutrient Goal": CHÍNH `NutrientGoalBar` (cùng hình học `goalProgress` với mọi thanh khác) vẽ MỘT VÍ DỤ có đủ
 * floor / target / ceiling theo màu của chất đang xem — dải tối từ floor tới ceiling, phần sau ceiling là nền xám — kèm ba mũi tên
 * Floor / Target / Ceiling đặt đúng vị trí thật của từng mốc.
 */
export function GoalAnatomy({ info }: { readonly info: NutrientInfo }) {
  const progress = goalProgress(SAMPLE_GOAL, SAMPLE_CONSUMED, 'tile', SAMPLE_ANCHOR_AT)
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
        anchorAt={SAMPLE_ANCHOR_AT}
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
