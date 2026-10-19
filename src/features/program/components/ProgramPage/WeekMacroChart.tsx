import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAY_LETTERS } from '../../utils/day-macros'

export interface ChartDay {
  readonly kcal: number
  readonly proteinG: number
  readonly carbsG: number
  readonly fatG: number
  readonly locked?: boolean
}

interface WeekMacroChartProps {
  /** Bảy ngày Monday → Sunday. */
  readonly days: readonly ChartDay[]
  /** Có thì hàng chữ cái ngày bên dưới là nút chọn ngày (editor); không thì chỉ là nhãn. */
  readonly selected?: number
  readonly onSelect?: (index: number) => void
  /** Chiều cao vùng macro (mặc định 16rem). */
  readonly chartClassName?: string
}

const BLOCKS = [
  { key: 'P', field: 'proteinG', kcalPerGram: 4, color: 'bg-[var(--mf-tile-protein)]' },
  { key: 'F', field: 'fatG', kcalPerGram: 9, color: 'bg-[var(--mf-tile-fat)]' },
  { key: 'C', field: 'carbsG', kcalPerGram: 4, color: 'bg-[var(--mf-tile-carbs)]' },
] as const

const GROW = 'transition-[flex-grow] duration-300 ease-out motion-reduce:transition-none'

/**
 * Biểu đồ bảy ngày của một program: mỗi cột có viên calo xanh dương và ba khối P / F / C xếp chồng, chiều cao mỗi khối tỉ lệ số
 * calo chất đó đóng góp (gram × kcal/g). Chiều cao là `flex-grow` có transition nên kéo slider ở editor thì các khối đổi mượt tức
 * thì; truyền `onSelect` để hàng chữ cái ngày thành nút chọn ngày (ngày khoá có icon khoá).
 */
export function WeekMacroChart({
  days,
  selected,
  onSelect,
  chartClassName = 'h-64',
}: WeekMacroChartProps) {
  return (
    <div>
      <ul aria-label="Daily targets" className="flex gap-2">
        {days.map((day, index) => (
          <li key={index} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="flex h-8 w-full items-center justify-center rounded-full bg-[var(--mf-tile-calories)] text-sm font-medium text-black/80 tabular-nums">
              {Math.round(day.kcal)}
            </span>
            <div className={cn('flex w-full flex-col gap-2', chartClassName)}>
              {BLOCKS.map((block) => {
                const grams = day[block.field]
                return (
                  <span
                    key={block.key}
                    style={{ flexGrow: Math.max(grams * block.kcalPerGram, 0.0001) }}
                    className={cn(
                      block.color,
                      GROW,
                      'flex basis-0 items-center justify-center overflow-hidden rounded-lg text-sm font-medium text-black/80 tabular-nums',
                      grams > 0 ? 'min-h-9' : 'min-h-0'
                    )}
                  >
                    {grams > 0 && `${Math.round(grams)} ${block.key}`}
                  </span>
                )
              })}
            </div>
          </li>
        ))}
      </ul>

      <ul className="mt-3 flex gap-2" aria-label={onSelect ? 'Select a day' : undefined}>
        {days.map((day, index) => {
          const content = (
            <>
              {DAY_LETTERS[index]}
              {day.locked && (
                <Lock
                  aria-label="Locked"
                  className="bg-background text-foreground absolute -top-1.5 -right-1 size-4 rounded-full p-0.5"
                />
              )}
            </>
          )
          const className = cn(
            'relative flex h-10 w-full items-center justify-center rounded-full text-base transition-[background-color,color,transform] duration-300 motion-reduce:transition-none',
            selected === index
              ? 'bg-foreground text-background font-medium'
              : 'text-muted-foreground'
          )
          return (
            <li key={index} className="min-w-0 flex-1">
              {onSelect ? (
                <button
                  type="button"
                  aria-pressed={selected === index}
                  onClick={() => onSelect(index)}
                  className={cn(
                    className,
                    'focus-visible:ring-ring/50 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100',
                    selected !== index && 'bg-secondary'
                  )}
                >
                  {content}
                </button>
              ) : (
                <span className={className}>{content}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
