import type { FullBodyHistoryItem } from '@/features/shortcuts/types/body-metrics.types'
import { useUnits } from '@/features/users/hooks/use-units'
import { cn } from '@/lib/utils'
import { METRIC_SECTIONS, formatMetric, metricValue } from '../../full-body.utils'

interface MetricSectionsProps {
  readonly item: FullBodyHistoryItem
  /** Hướng đổi ngày để nội dung trượt vào từ đúng phía (null = lần đầu, chỉ hiện dần). */
  readonly direction: 'back' | 'forward' | null
}

/**
 * Mọi số đo của một ngày (All Metrics): các nhóm Weight & Body Fat, Upper Body, Arms, Legs, chỉ hàng có giá trị (tên trái,
 * số phải); nhóm trống bị ẩn. Đổi ngày thì cả khối hiện dần + trượt 300ms theo hướng vuốt.
 */
export function MetricSections({ item, direction }: MetricSectionsProps) {
  const { weight } = useUnits()
  const sections = METRIC_SECTIONS.map((section) => ({
    ...section,
    rows: section.rows.flatMap((row) => {
      const value = metricValue(item, row.key)
      return value === null ? [] : [{ ...row, value }]
    }),
  })).filter((section) => section.rows.length > 0)

  return (
    <div
      key={item.date}
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 space-y-6 motion-safe:duration-300',
        direction === 'forward' && 'motion-safe:slide-in-from-right-6',
        direction === 'back' && 'motion-safe:slide-in-from-left-6'
      )}
    >
      {sections.map((section) => (
        <section key={section.title} aria-label={section.title} className="space-y-2">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <ul className="bg-card rounded-xl">
            {section.rows.map((row, index) => (
              <li
                key={row.key}
                className={cn(
                  'ml-4 flex min-h-12 items-center gap-3 pr-4',
                  index > 0 && 'border-border border-t'
                )}
              >
                <span className="flex-1 text-base">{row.label}</span>
                <span className="text-muted-foreground text-base tabular-nums">
                  {formatMetric(row.value, row.unit, weight)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
