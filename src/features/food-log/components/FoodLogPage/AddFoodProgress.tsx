import { cn } from '@/lib/utils'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { MacroTotals } from '../../types/food-log.types'

interface AddFoodProgressProps {
  /** Tổng đã log trong ngày; chưa tải xong thì hiện 0. */
  readonly totals?: MacroTotals
  readonly target?: ProgramWeek | null
  /** Món đang nằm trong plate: cộng vào để xem trước ngày sẽ thế nào sau khi log. */
  readonly plate: MacroTotals
}

interface Cell {
  readonly name: string
  /** Ký hiệu cạnh số (F/P/C); kcal không có ký hiệu khi đã có mục tiêu, giống MacroFactor. */
  readonly suffix: string
  readonly value: number
  readonly goal?: number
  readonly bar: string
}

/** Tiến độ nhỏ gọn trên đầu sheet (kiểu MacroFactor): 4 ô kcal/F/P/C + thanh mảnh. Vượt target không đổi đỏ (BR-18). */
export function AddFoodProgress({ totals, target, plate }: AddFoodProgressProps) {
  const sum = (key: keyof MacroTotals) => Math.round((totals?.[key] ?? 0) + plate[key])
  const cells: Cell[] = [
    {
      name: 'kcal',
      suffix: '',
      value: sum('calories'),
      goal: target?.caloriesTarget,
      bar: 'bg-mf-calories',
    },
    { name: 'F', suffix: 'F', value: sum('fat'), goal: target?.fatTarget, bar: 'bg-mf-fat' },
    {
      name: 'P',
      suffix: 'P',
      value: sum('protein'),
      goal: target?.proteinTarget,
      bar: 'bg-mf-protein',
    },
    { name: 'C', suffix: 'C', value: sum('carbs'), goal: target?.carbsTarget, bar: 'bg-mf-carbs' },
  ]
  return (
    <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-1.5" aria-label="Daily progress">
      {cells.map((cell) => {
        const percent = cell.goal ? Math.min(100, (cell.value / cell.goal) * 100) : 0
        return (
          <div key={cell.name} className="min-w-0">
            <dt className="sr-only">{cell.name}</dt>
            <dd className="truncate text-xs tabular-nums">
              <span className="font-semibold">{cell.value}</span>
              <span className="text-muted-foreground">
                {cell.goal ? ` / ${Math.round(cell.goal)}` : ''}
                {cell.suffix ? ` ${cell.suffix}` : cell.goal ? '' : ' kcal'}
              </span>
            </dd>
            <div className="bg-muted h-1 overflow-hidden rounded-full" aria-hidden="true">
              <div
                className={cn('h-full rounded-full transition-[width] duration-300', cell.bar)}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )
      })}
    </dl>
  )
}
