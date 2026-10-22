import { Lock } from 'lucide-react'
import { KCAL_PER_GRAM } from '@/features/nutrition/atwater'
import { useUnits } from '@/features/users/hooks/use-units'
import { cn } from '@/lib/utils'
import { dayLetter } from '@/lib/week'
import { WEEK_DAYS } from '../../utils/day-macros'
import { KCAL_EXTRA_EM, MACRO_EXTRA_EM, cellFontSize } from './chart-fit'

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
  {
    key: 'P',
    field: 'proteinG',
    kcalPerGram: KCAL_PER_GRAM.protein,
    color: 'bg-[var(--mf-tile-protein)]',
  },
  { key: 'F', field: 'fatG', kcalPerGram: KCAL_PER_GRAM.fat, color: 'bg-[var(--mf-tile-fat)]' },
  {
    key: 'C',
    field: 'carbsG',
    kcalPerGram: KCAL_PER_GRAM.carbs,
    color: 'bg-[var(--mf-tile-carbs)]',
  },
] as const

const GROW = 'transition-[flex-grow] duration-300 ease-out motion-reduce:transition-none'

/**
 * Biểu đồ bảy ngày của một program: mỗi cột có viên calo xanh dương và ba khối P / F / C xếp chồng, chiều cao mỗi khối tỉ lệ số
 * calo chất đó đóng góp (gram × kcal/g). Chiều cao là `flex-grow` có transition nên kéo slider ở editor thì các khối đổi mượt tức
 * thì; truyền `onSelect` để hàng chữ cái ngày thành nút chọn ngày (ngày khoá có icon khoá). Mỗi cột là một `@container` và chữ trong ô co theo
 * bề rộng cột (`cellFontSize`) nên số calo (kcal hoặc kJ) và "175 P" luôn nằm gọn một dòng, kể cả ở 320px.
 */
export function WeekMacroChart({
  days,
  selected,
  onSelect,
  chartClassName = 'h-64',
}: WeekMacroChartProps) {
  const { energy } = useUnits()
  return (
    <div>
      <ul aria-label="Daily targets" className="flex gap-1.5">
        {days.map((day, index) => {
          const kcalText = energy.format(day.kcal)
          return (
            <li key={index} className="@container flex min-w-0 flex-1 flex-col items-center gap-2">
              <span
                style={{ fontSize: cellFontSize(kcalText.length, KCAL_EXTRA_EM) }}
                className="flex h-8 w-full items-center justify-center rounded-full bg-[var(--mf-tile-calories)] font-medium whitespace-nowrap text-black/80 tabular-nums"
              >
                {kcalText}
              </span>
              <div className={cn('flex w-full flex-col gap-2', chartClassName)}>
                {BLOCKS.map((block) => {
                  const grams = day[block.field]
                  const rounded = Math.round(grams)
                  return (
                    <span
                      key={block.key}
                      style={{
                        flexGrow: Math.max(grams * block.kcalPerGram, 0.0001),
                        fontSize: cellFontSize(String(rounded).length, MACRO_EXTRA_EM),
                      }}
                      className={cn(
                        block.color,
                        GROW,
                        'flex basis-0 items-center justify-center overflow-hidden rounded-lg font-medium whitespace-nowrap text-black/80 tabular-nums',
                        grams > 0 ? 'min-h-9' : 'min-h-0'
                      )}
                    >
                      {grams > 0 && `${rounded} ${block.key}`}
                    </span>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>

      <ul className="mt-3 flex gap-1.5" aria-label={onSelect ? 'Select a day' : undefined}>
        {days.map((day, index) => {
          const content = (
            <>
              {dayLetter(WEEK_DAYS[index])}
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
