import Image from 'next/image'
import { Pencil, Smartphone } from 'lucide-react'
import { formatSteps, type StepsDay } from '../steps.utils'
import { entryDayLabel, groupByMonth } from '@/features/weight/body-metric.utils'

interface StepsHistoryListProps {
  readonly days: readonly StepsDay[]
  readonly onEdit: (date: string) => void
}

/** Biểu tượng nguồn bên trái mỗi dòng: nhập tay = logo MacroOS, nguồn đồng bộ khác = biểu tượng thiết bị. */
function SourceIcon({ source }: { readonly source: string | undefined }) {
  const manual = !source || source.toLowerCase() === 'manual'
  return manual ? (
    <Image
      src="/icon-192.png"
      alt=""
      width={40}
      height={40}
      className="size-10 shrink-0 rounded-lg"
    />
  ) : (
    <span className="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-lg">
      <Smartphone aria-hidden="true" className="size-5" />
    </span>
  )
}

/**
 * Lịch sử theo tháng (mới trước) như MacroFactor: biểu tượng nguồn bên trái, "2587 steps" đậm + ngày "Tue, Oct 20" mờ, nút bút chì tròn bên
 * phải mở bảng sửa (xoá nằm trong bảng); tháng và dòng hiện lần lượt.
 */
export function StepsHistoryList({ days, onEdit }: StepsHistoryListProps) {
  const months = groupByMonth(days)
  if (months.length === 0) return null
  return (
    <div className="space-y-6">
      {months.map((month) => (
        <section key={month.key} aria-label={month.label} className="space-y-3">
          <h2 className="text-xl font-bold">{month.label}</h2>
          <ul className="bg-card divide-foreground/10 divide-y overflow-hidden rounded-xl">
            {month.items.map((day, index) => (
              <li
                key={day.date}
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animation-duration-300 flex min-h-18 items-center gap-4 px-4 py-2 [animation-fill-mode:backwards]"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <SourceIcon source={day.source} />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-medium tabular-nums">{formatSteps(day.steps)} steps</p>
                  <p className="text-muted-foreground text-base">{entryDayLabel(day.date)}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Edit ${entryDayLabel(day.date)}`}
                  onClick={() => onEdit(day.date)}
                  className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
                >
                  <Pencil aria-hidden="true" fill="currentColor" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
