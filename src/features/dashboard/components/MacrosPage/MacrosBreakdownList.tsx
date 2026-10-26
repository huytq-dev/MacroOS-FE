import {
  MACRO_PARTS,
  MACRO_PART_STYLE,
  drawnKcal,
  percentText,
  stackTotal,
  type MacroBar,
  type MacroPartialDay,
} from '../../macros-detail'
import { groupByMonth } from '@/features/weight/body-metric.utils'
import { formatWeekdayMonthDay } from '@/lib/week'
import { cn } from '@/lib/utils'
import { useUnits } from '@/features/users/hooks/use-units'

type Row =
  (MacroBar & { readonly partial?: false }) | (MacroPartialDay & { readonly partial: true })

const gramOrDash = (value: number | null) => (value === null ? '—' : `${Math.round(value)} g`)

/** Ba chữ cái cạnh phần trăm (Other không có chữ, chỉ là phần còn lại của thanh), như MacroFactor "7% P • 6% F • 37% C". */
const PERCENT_LABEL = [
  ['protein', 'P'],
  ['fat', 'F'],
  ['carbs', 'C'],
] as const

/**
 * Chú giải Protein / Fat / Carbs / Other với biểu tượng ba cột nhỏ cùng màu: đọc cùng bảng `MACRO_PART_STYLE` với biểu đồ và các thanh ngang. Thứ tự hiển thị
 * như MacroFactor (Protein, Fat, Carbs, Other).
 */
export function MacrosLegend() {
  return (
    <ul className="bg-card flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl px-3 py-4 text-sm sm:gap-x-5 sm:px-4 sm:text-base">
      {(['protein', 'fat', 'carbs', 'other'] as const).map((part) => (
        <li key={part} className="flex items-center gap-1.5">
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            className={cn('size-4', MACRO_PART_STYLE[part].fill)}
          >
            <rect x="0.5" y="5" width="3" height="7" rx="0.5" />
            <rect x="4.5" y="1" width="3" height="11" rx="0.5" />
            <rect x="8.5" y="7" width="3" height="5" rx="0.5" />
          </svg>
          {MACRO_PART_STYLE[part].label}
        </li>
      ))}
    </ul>
  )
}

/**
 * Lịch sử từng ngày đã ghi theo tháng (mới trước) như MacroFactor: ngày "Wed, Oct 21", "7% P • 6% F • 37% C" bên phải (phần trăm CALO của ngày) và thanh
 * ngang xếp Carbs / Fat / Protein / Other theo đúng tỉ lệ; ngày tổng 0 thì thanh để trống và 0%.
 */
export function MacrosBreakdownList({
  days,
  partial = [],
}: {
  readonly days: readonly MacroBar[]
  /** Ngày đã log nhưng thiếu phân tích macro (calories-only / macro-only): hiện số BE có, "Breakdown unavailable", không thanh giả. */
  readonly partial?: readonly MacroPartialDay[]
}) {
  const { energy } = useUnits()
  const rows: Row[] = [...days, ...partial.map((day) => ({ ...day, partial: true as const }))]
  const months = groupByMonth(rows)
  if (months.length === 0) return null
  return (
    <div className="space-y-6">
      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="space-y-3">
          <h2 className="text-xl font-bold">{month.label}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {month.items.map((day, index) => {
              if (day.partial)
                return (
                  <li
                    key={day.date}
                    className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 space-y-2 px-4 py-3 [animation-fill-mode:backwards]"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-lg font-medium">{formatWeekdayMonthDay(day.date)}</p>
                      <p className="text-muted-foreground text-base whitespace-nowrap tabular-nums">
                        {day.caloriesKcal === null ? '—' : energy.text(day.caloriesKcal)}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-sm tabular-nums">
                      P {gramOrDash(day.proteinG)} • F {gramOrDash(day.fatG)} • C{' '}
                      {gramOrDash(day.carbsG)}
                      <span className="sr-only">, no macro breakdown</span>
                    </p>
                    <div
                      role="img"
                      aria-label="Macro breakdown unavailable"
                      className="bg-foreground/10 h-1.5 rounded-full"
                    />
                    <p className="text-muted-foreground text-xs">Breakdown unavailable</p>
                  </li>
                )
              const total = stackTotal(day)
              return (
                <li
                  key={day.date}
                  className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 space-y-2 px-4 py-3 [animation-fill-mode:backwards]"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-lg font-medium">{formatWeekdayMonthDay(day.date)}</p>
                    <p className="text-muted-foreground text-base whitespace-nowrap tabular-nums">
                      {PERCENT_LABEL.map(
                        ([part, letter]) => `${percentText(day, part)} ${letter}`
                      ).join(' • ')}
                    </p>
                  </div>
                  <div
                    role="img"
                    aria-label={MACRO_PARTS.map(
                      (part) => `${MACRO_PART_STYLE[part].label} ${percentText(day, part)}`
                    ).join(', ')}
                    className="bg-foreground/10 flex h-1.5 overflow-hidden rounded-full"
                  >
                    {total > 0 &&
                      MACRO_PARTS.map((part) => (
                        <span
                          key={part}
                          style={{ width: `${(drawnKcal(day, part) / total) * 100}%` }}
                          className={MACRO_PART_STYLE[part].bg}
                        />
                      ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
