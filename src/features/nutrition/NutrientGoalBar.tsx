import { goalProgress, type NutrientGoal } from './goal-progress'
import { formatAmount } from './nutrient-display'
import { cn } from '@/lib/utils'

/** Kiểu vẽ của thanh (không ảnh hưởng thang): `tile` = ô nền cao + vạch mảnh (Dashboard / Overview / minh hoạ), `row` = thanh mảnh trong hàng. */
export type GoalBarLayout = 'tile' | 'row'

interface NutrientGoalBarProps {
  /** floor / target / ceiling hiệu lực; thiếu hoặc không có mốc nào thì thanh trống, không vạch. */
  readonly goal: Partial<NutrientGoal> | null | undefined
  /** null = chưa có dữ liệu chất này (thanh trống; chữ "---" do nơi dùng hiển thị). */
  readonly consumed: number | null
  /** Lớp nền literal của chất (vd. `bg-mf-tile-fat`, xem `nutrientTone`). */
  readonly tone: string
  /** Kiểu vẽ: `tile` (ô Dashboard / thẻ Overview: nền cao, phần ăn là vạch mảnh) hoặc `row` (hàng chất, thẻ macro, lịch sử: thanh mảnh). */
  readonly layout: GoalBarLayout
  /** Thang chung của cả danh sách (lịch sử, tóm tắt) = max thang từng hàng để các hàng so sánh được; bỏ trống = thang của chính mục tiêu. */
  readonly scaleMax?: number
  /** Đơn vị của chất: có thì (kiểu `tile`) trần quá xa để vẽ được ghi thành chữ nhỏ dưới thanh, vd. "Limit 2000 mg". */
  readonly unit?: string
  readonly className?: string
}

const pct = (value: number) => `${value * 100}%`

/**
 * Thanh tiến độ mục tiêu DUY NHẤT của app: floor → ceiling là dải mờ màu chất (mở về phía còn thiếu), phần đã ăn tô đặc màu chất (tô
 * dần từ trái, đổi lượng thì chạy mượt), phần vượt ceiling đổi sang màu cảnh báo, và CHỈ có một vạch trắng ở target (không target thì
 * không vạch). Thang là ADAPTIVE GOAL SCALE (`goalScaleMax`): chỉ phụ thuộc mục tiêu, mọi mốc và phần đã ăn ở vị trí = giá trị / thang; ăn vượt thang thì thanh đầy (thang KHÔNG giãn). Trần quá xa để vẽ được (vd. vitamin C 90 / 2000) thì không vẽ trên thanh mà ghi chữ nhỏ "Limit …" dưới thanh (kiểu `tile` có `unit`).
 */
export function NutrientGoalBar({
  goal,
  consumed,
  tone,
  layout,
  scaleMax,
  unit,
  className,
}: NutrientGoalBarProps) {
  const progress = goalProgress(goal, consumed, scaleMax)
  const thin = layout === 'row'
  const overStart = progress.status === 'over' ? progress.ceilingAt : null
  // Ô Dashboard (đo từ ảnh MF): ô nền cao ~14px, phần đã ăn là vạch mảnh ~5px nằm giữa ô; hàng chất (thin) tô kín chiều cao thanh mảnh
  const fillBox = thin ? 'inset-y-0' : 'top-1/2 h-[5px] -translate-y-1/2'
  // Vạch target sáng khi đã chạm / vượt, mờ khi chưa tới (như ảnh MF)
  const reached = progress.targetAt !== null && progress.fill >= progress.targetAt
  const solid = overStart ?? progress.fill
  const tick = progress.targetAt !== null && (
    <span
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-500 absolute top-1/2 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-500',
        thin ? 'h-3' : 'h-2',
        reached ? 'bg-foreground' : 'bg-foreground/35'
      )}
      style={{ left: pct(progress.targetAt) }}
    />
  )
  const track = (
    <div
      className={cn(
        'relative overflow-hidden',
        thin ? 'bg-foreground/[0.07] h-1.5 rounded-full' : 'bg-foreground/[0.08] h-3.5 rounded-sm'
      )}
    >
      {progress.zone && (
        <span
          className={cn(
            'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-500 absolute inset-y-0 opacity-30',
            tone
          )}
          style={{
            left: pct(progress.zone[0]),
            width: pct(progress.zone[1] - progress.zone[0]),
          }}
        />
      )}
      <span
        className={cn(
          'motion-safe:animate-bar-grow absolute left-0 transition-[width] duration-500 ease-out motion-reduce:transition-none',
          fillBox,
          tone
        )}
        style={{ width: pct(solid) }}
      />
      {overStart !== null && (
        <span
          className={cn(
            'bg-destructive motion-safe:animate-in motion-safe:fade-in-0 absolute transition-[left,width] duration-500 ease-out motion-reduce:transition-none',
            fillBox
          )}
          style={{ left: pct(overStart), width: pct(progress.fill - overStart) }}
        />
      )}
      {/* Thanh dày: vạch nằm trong thanh */}
      {!thin && tick}
    </div>
  )
  // Thanh mảnh: vạch cao hơn thanh nên nằm ngoài khung cắt (overflow-hidden) của thanh
  return (
    <div
      aria-hidden="true"
      data-status={progress.status}
      className={cn('relative', thin && 'flex h-3 items-center', className)}
    >
      {thin ? <div className="w-full">{track}</div> : track}
      {thin && tick}
      {!thin && unit && progress.ceilingOffScale && progress.ceilingValue !== null && (
        <p className="text-muted-foreground mt-1 truncate text-xs">
          Limit {formatAmount(progress.ceilingValue, unit)} {unit}
        </p>
      )}
    </div>
  )
}
