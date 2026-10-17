import { cn } from '@/lib/utils'
import type { ProgramWeek } from '@/features/program/types/program.types'
import type { MacroTotals } from '../../types/food-log.types'

export type BannerDisplay = 'PlateOnly' | 'AllDayAndPlate' | 'RemainingAfterPlate'

interface AddFoodProgressProps {
  /** Tổng đã log trong ngày; chưa tải xong thì hiện 0. */
  readonly totals?: MacroTotals
  readonly target?: ProgramWeek | null
  /** Món đang nằm trong plate: cộng vào để xem trước ngày sẽ thế nào sau khi log. */
  readonly plate: MacroTotals
  /** Chất nào hiện trên banner (Logger Banner); mặc định chỉ kcal như MacroFactor. */
  readonly show: { calories: boolean; protein: boolean; fat: boolean; carbs: boolean }
  readonly display: BannerDisplay
}

interface Cell {
  readonly key: keyof MacroTotals
  readonly suffix: string
  readonly goal?: number
  readonly bar: string
}

const STUB = ' '

/**
 * Banner tiến độ đầu bảng Thêm món (Logger Banner của MacroFactor): các chất được bật xếp 2 hàng theo cột (kcal, P / F, C), mỗi
 * chất có số và thanh mảnh. PlateOnly: "plate / mục tiêu"; AllDayAndPlate: "cả ngày + plate / mục tiêu"; RemainingAfterPlate:
 * "còn lại sau plate". Chỉ một chất thì hiện trong viên thuốc viền. Vượt mục tiêu không đổi đỏ (BR-18), thanh dừng ở đầy.
 */
export function AddFoodProgress({ totals, target, plate, show, display }: AddFoodProgressProps) {
  const all: (Cell & { on: boolean })[] = [
    {
      key: 'calories',
      suffix: '',
      goal: target?.caloriesTarget,
      bar: 'bg-mf-tile-calories',
      on: show.calories,
    },
    {
      key: 'protein',
      suffix: 'P',
      goal: target?.proteinTarget,
      bar: 'bg-mf-tile-protein',
      on: show.protein,
    },
    { key: 'fat', suffix: 'F', goal: target?.fatTarget, bar: 'bg-mf-tile-fat', on: show.fat },
    {
      key: 'carbs',
      suffix: 'C',
      goal: target?.carbsTarget,
      bar: 'bg-mf-tile-carbs',
      on: show.carbs,
    },
  ]
  const cells = all.filter((cell) => cell.on)
  const single = cells.length === 1
  const valueOf = (cell: Cell) => {
    const day = totals?.[cell.key] ?? 0
    const inPlate = plate[cell.key]
    if (display === 'PlateOnly') return Math.round(inPlate)
    if (display === 'AllDayAndPlate') return Math.round(day + inPlate)
    return Math.round((cell.goal ?? 0) - day - inPlate)
  }
  return (
    <dl
      className={cn(
        'grid min-w-0 flex-1 grid-flow-col grid-rows-2 gap-x-3 gap-y-1.5 transition-[grid-template-columns] duration-300',
        single && 'grid-rows-1'
      )}
      aria-label="Daily progress"
    >
      {cells.map((cell) => {
        const value = valueOf(cell)
        const used = display === 'RemainingAfterPlate' ? (cell.goal ?? 0) - value : value
        const percent = cell.goal ? Math.max(0, Math.min(100, (used / cell.goal) * 100)) : 0
        const text =
          display === 'RemainingAfterPlate'
            ? `${value} left`
            : `${value}${cell.goal ? ` / ${Math.round(cell.goal)}` : ''}`
        return (
          <div
            key={cell.key}
            className={cn(
              'motion-safe:animate-in motion-safe:fade-in-0 min-w-0 motion-safe:duration-300',
              single &&
                'border-foreground/15 flex items-center justify-center rounded-full border-2 px-4 py-2'
            )}
          >
            <dt className="sr-only">{cell.key}</dt>
            <dd className="truncate text-xs tabular-nums">
              <span className={cn(single ? 'text-base' : 'font-medium')}>{text}</span>
              {cell.suffix && (
                <span className="text-muted-foreground">
                  {STUB}
                  {cell.suffix}
                </span>
              )}
            </dd>
            {!single && (
              <div className="bg-muted h-1 overflow-hidden rounded-full" aria-hidden="true">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-300', cell.bar)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </div>
        )
      })}
    </dl>
  )
}
