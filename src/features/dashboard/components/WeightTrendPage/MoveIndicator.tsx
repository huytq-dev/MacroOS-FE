import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { WeightMove } from '../../weight-trend.utils'

const MOVES = {
  up: { icon: ArrowUp, label: 'Up' },
  down: { icon: ArrowDown, label: 'Down' },
  same: { icon: ArrowRight, label: 'No Change' },
} as const

/** Mũi tên tím + chữ cho biến động xu hướng cân nặng (tăng / giảm / không đổi). */
export function MoveIndicator({ move }: { readonly move: WeightMove }) {
  const { icon: Icon, label } = MOVES[move]
  return (
    <span className="text-muted-foreground flex items-center gap-2 text-base">
      <Icon aria-hidden="true" className="text-mf-purple size-5" strokeWidth={2.5} />
      {label}
    </span>
  )
}
