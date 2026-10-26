import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { targetRatio } from '@/features/nutrition/goal-progress'
import { useUnits } from '@/features/users/hooks/use-units'
import { bannerValue } from '../../food-log-settings'
import type { EffectiveNutrition, MacroTotals } from '../../types/food-log.types'

export type BannerDisplay = 'PlateOnly' | 'AllDayAndPlate' | 'RemainingAfterPlate'

interface AddFoodProgressProps {
  /** Tổng đã log trong ngày; chưa tải xong thì hiện 0. */
  readonly totals?: MacroTotals
  /**
   * Ngày hiệu lực của BE. Có override (`hasOverride`) thì số chính là số hiệu lực (null = "—", không điền từ món, không cộng plate) và tổng
   * Food Log hiện riêng ở dòng nhỏ bên dưới; không có override thì như cũ (số các món + plate).
   */
  readonly effective?: EffectiveNutrition | null
  readonly target?: ProgramWeek | null
  /** Món đang nằm trong plate: cộng vào để xem trước ngày sẽ thế nào sau khi log. */
  readonly plate: MacroTotals
  /** Chất nào hiện trên banner (Logger Banner); mặc định chỉ kcal như MacroFactor. */
  readonly show: { calories: boolean; protein: boolean; fat: boolean; carbs: boolean }
  readonly display: BannerDisplay
  /** stack = hai hàng theo cột (kcal, P / F, C) trong thanh đầu bảng Thêm món; row = một hàng ngang rộng (màn sửa món đã log). */
  readonly layout?: 'stack' | 'row'
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
export function AddFoodProgress({
  totals,
  effective,
  target,
  plate,
  show,
  display,
  layout = 'stack',
}: AddFoodProgressProps) {
  const { energy } = useUnits()
  // Calo đổi sang kcal / kJ của user (BE luôn kcal) TRƯỚC khi làm tròn, rồi mọi phép "còn lại" tính ở đơn vị đang hiện (`bannerValue` →
  // `shownProgress`, MỘT quy tắc chung với Daily / Weekly Nutrition và Food Log); macro là gram
  const shownOf = (cell: Cell) => (value: number) =>
    Math.round(cell.key === 'calories' ? energy.convert(value) : value)
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
  // Ngày có override: số chính là số hiệu lực của BE (macro null = "—"; plate không đổi override nên không cộng); PlateOnly vẫn chỉ là plate
  const overridden = effective?.hasOverride === true && display !== 'PlateOnly'
  const effectiveOf = (key: keyof MacroTotals): number | null | undefined =>
    key === 'calories'
      ? effective?.calories
      : key === 'protein'
        ? effective?.proteinG
        : key === 'fat'
          ? effective?.fatG
          : key === 'carbs'
            ? effective?.carbsG
            : undefined
  const foodLogLine = overridden
    ? `Food Log ${energy.text((effective?.foodLogCalories ?? 0) + plate.calories)}`
    : null
  const grid = (
    <dl
      style={
        layout === 'row'
          ? { gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }
          : undefined
      }
      className={cn(
        // Điện thoại hẹp (≤375px): cột sát nhau hơn và chữ 11px để "1085 / 2034" không bị cắt thành "1085 / 2…" trong thanh đầu bảng Thêm món
        'grid min-w-0 flex-1 gap-x-1 gap-y-1.5 transition-[grid-template-columns] duration-300 sm:gap-x-3',
        layout === 'row' ? 'grid-flow-row grid-rows-1' : 'grid-flow-col grid-rows-2',
        single && 'grid-rows-1'
      )}
      aria-label="Daily progress"
    >
      {cells.map((cell) => {
        const toShown = shownOf(cell)
        const goal = cell.goal ? toShown(cell.goal) : null
        // null = "còn lại" mà chưa có target: hiện "—" và không có thanh (không suy ra số âm từ target 0)
        const day = overridden ? effectiveOf(cell.key) : (totals?.[cell.key] ?? 0)
        const unknown = day === null || day === undefined
        const value = unknown
          ? null
          : bannerValue(display, cell.goal, day, overridden ? 0 : plate[cell.key], toShown)
        const used = display === 'RemainingAfterPlate' ? (goal ?? 0) - (value ?? 0) : (value ?? 0)
        const percent = goal && value !== null ? targetRatio(used, goal).progress * 100 : 0
        const text =
          value === null
            ? '—'
            : display === 'RemainingAfterPlate'
              ? `${value} left`
              : `${value}${goal ? ` / ${goal}` : ''}`
        return (
          <div
            key={cell.key}
            className={cn(
              'motion-safe:animate-in motion-safe:fade-in-0 min-w-0 motion-safe:duration-300',
              single && 'flex flex-col justify-center'
            )}
          >
            <dt className="sr-only">{cell.key}</dt>
            <dd
              className={cn(
                'truncate tabular-nums',
                single
                  ? 'text-center text-base'
                  : 'text-[10.5px] min-[390px]:text-[11px] sm:text-xs'
              )}
            >
              {/* Hàng ngang (màn sửa món): ký hiệu đứng trước số, calo là ngọn lửa; hai hàng (thanh Thêm món): chữ đứng sau */}
              {layout === 'row' &&
                (cell.key === 'calories' ? (
                  <Flame
                    aria-hidden="true"
                    fill="currentColor"
                    className="mr-1 mb-0.5 inline size-3.5"
                  />
                ) : (
                  <span className="mr-1 font-bold">{cell.suffix}</span>
                ))}
              <span className="font-medium">{text}</span>
              {unknown && <span className="sr-only">, no data</span>}
              {layout !== 'row' && cell.suffix && (
                <span className="text-muted-foreground">
                  {STUB}
                  {cell.suffix}
                </span>
              )}
            </dd>
            <div
              className={cn(
                'bg-muted overflow-hidden rounded-full',
                single ? 'mt-1.5 h-1.5' : 'h-1'
              )}
              aria-hidden="true"
            >
              <div
                className={cn(
                  'motion-safe:animate-bar-grow h-full rounded-full transition-[width] duration-500',
                  cell.bar
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )
      })}
    </dl>
  )
  if (!foodLogLine) return grid
  // Dòng riêng cho tổng Food Log (món đã log, không phải số đang tính): thêm / sửa / xoá món đổi dòng này, không đổi override
  return (
    <div className="min-w-0 flex-1">
      {grid}
      <p className="text-muted-foreground mt-1 text-center text-[11px] leading-tight tabular-nums">
        {foodLogLine}
      </p>
    </div>
  )
}
