import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { WeightMove } from '../../weight-trend.utils'

const MOVES = {
  up: { icon: ArrowUpRight, label: 'Increase' },
  down: { icon: ArrowDownRight, label: 'Decrease' },
  same: { icon: ArrowRight, label: 'No Change' },
} as const

/** Mũi tên tím + chữ cho biến động xu hướng cân nặng (↗ tăng / ↘ giảm / → không đổi); `text` thay nhãn mặc định (vd. "−0.1 kg"). */
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
