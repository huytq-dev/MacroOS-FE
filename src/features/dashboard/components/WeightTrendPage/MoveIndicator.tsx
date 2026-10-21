import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import type { WeightMove } from '../../weight-trend.utils'

const MOVES = {
  up: { icon: TrendingUp, label: 'Increase' },
  down: { icon: TrendingDown, label: 'Decrease' },
  same: { icon: ArrowRight, label: 'No Change' },
} as const

/** Biểu tượng tím + chữ cho biến động xu hướng cân nặng (xu hướng lên / xuống / mũi tên ngang); `text` thay nhãn mặc định (vd. "−0.1 kg"). */
export function MoveIndicator({
  move,
  text,
}: {
  readonly move: WeightMove
  readonly text?: string
}) {
  const { icon: Icon, label } = MOVES[move]
  return (
    <span className="text-muted-foreground flex items-center gap-2 text-base whitespace-nowrap tabular-nums">
      <Icon aria-hidden="true" className="text-mf-purple size-5 shrink-0" strokeWidth={2.5} />
      {text ?? label}
    </span>
  )
}
