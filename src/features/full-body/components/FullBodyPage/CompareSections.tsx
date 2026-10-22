'use client'

import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { FullBodyHistoryItem } from '@/features/shortcuts/types/body-metrics.types'
import { useUnits } from '@/features/users/hooks/use-units'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import {
  METRIC_SECTIONS,
  changeTone,
  formatChange,
  formatMetric,
  metricValue,
  type GoalType,
  type MetricRowDef,
} from '../../full-body.utils'

const COUNT_MS = 500

/** Số thay đổi đếm từ 0 lên giá trị thật (500ms, ease-out); tắt khi `prefers-reduced-motion`. */
function CountUp({ delta, unit }: { readonly delta: number; readonly unit: MetricRowDef['unit'] }) {
  const { weight } = useUnits()
  const [shown, setShown] = useState(delta)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS)
      setShown(delta * (1 - (1 - progress) ** 3))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [delta])
  return <>{formatChange(shown, unit, weight)}</>
}

const TONE = {
  good: 'text-mf-tile-carbs',
  bad: 'text-destructive',
  neutral: 'text-muted-foreground',
} as const

/** Cột giá trị: cùng bề rộng ở tiêu đề nhóm và ở hàng để hai ngày thẳng cột. */
const VALUE_COL = 'w-[4.25rem] shrink-0 text-right'

interface CompareSectionsProps {
  readonly from: FullBodyHistoryItem | undefined
  readonly to: FullBodyHistoryItem | undefined
  readonly fromDate: string
  readonly toDate: string
  /** Mục tiêu của chương trình (WeightLoss / WeightGain / Maintenance) để tô xanh/đỏ phần thay đổi. */
  readonly goalType: GoalType
}

/**
 * So sánh hai ngày (Compare All Metrics): mỗi nhóm có tiêu đề + hai cột ngày; mỗi hàng là tên, thay đổi (↗/↘ + "+3 cm", xanh
 * khi đi đúng hướng mục tiêu, đỏ khi ngược lại, số đếm lên), giá trị ngày A và ngày B. Số đo chỉ có ở một ngày thì ô kia
 * là "—"; không có hoặc không đổi thì cột thay đổi để trống. Đổi một trong hai ngày thì khối hiện dần lại.
 */
export function CompareSections({ from, to, fromDate, toDate, goalType }: CompareSectionsProps) {
  const { weight } = useUnits()
  const sections = METRIC_SECTIONS.map((section) => ({
    ...section,
    rows: section.rows.flatMap((row) => {
      const a = metricValue(from, row.key)
      const b = metricValue(to, row.key)
      return a === null && b === null ? [] : [{ ...row, a, b }]
    }),
  })).filter((section) => section.rows.length > 0)

  const value = (number: number | null, unit: MetricRowDef['unit']) =>
    number === null ? '—' : formatMetric(number, unit, weight)

  return (
    <div
      key={`${fromDate}-${toDate}`}
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 space-y-6 motion-safe:duration-300"
    >
      {sections.map((section) => (
        <section key={section.title} aria-label={section.title} className="space-y-2">
          <div className="flex items-end gap-2 pr-4">
            {/* Một dòng như MacroFactor: chữ co theo bề ngang (tối đa 20px) để tiêu đề + hai cột ngày vừa 375px */}
            <h2 className="min-w-0 flex-1 text-[length:min(20px,5vw)] font-semibold whitespace-nowrap">
              {section.title}
            </h2>
            <span className={cn(VALUE_COL, 'text-muted-foreground text-[10px] uppercase')}>
              {formatDate(fromDate)}
            </span>
            <span className={cn(VALUE_COL, 'text-muted-foreground text-[10px] uppercase')}>
              {formatDate(toDate)}
            </span>
          </div>
          <ul className="bg-card rounded-xl">
            {section.rows.map((row, index) => {
              // Không đổi (như MacroFactor) thì không hiện thay đổi
              const raw = row.a !== null && row.b !== null ? row.b - row.a : null
              const delta = raw === null || Math.abs(raw) < 0.05 ? null : raw
              const tone = delta === null ? 'neutral' : changeTone(delta, row.key, goalType)
              const Icon = delta !== null && delta > 0 ? TrendingUp : TrendingDown
              return (
                <li
                  key={row.key}
                  className={cn(
                    'ml-4 flex min-h-12 items-center gap-2 py-2 pr-4',
                    index > 0 && 'border-border border-t'
                  )}
                >
                  <span className="min-w-0 flex-1 text-base">{row.label}</span>
                  <span
                    className={cn(
                      'flex shrink-0 items-center gap-1 text-sm tabular-nums transition-colors duration-300',
                      TONE[tone]
                    )}
                  >
                    {delta !== null && (
                      <>
                        <Icon aria-hidden="true" className="size-4" />
                        <CountUp delta={delta} unit={row.unit} />
                      </>
                    )}
                  </span>
                  <span className={cn(VALUE_COL, 'text-muted-foreground text-base tabular-nums')}>
                    {value(row.a, row.unit)}
                  </span>
                  <span className={cn(VALUE_COL, 'text-muted-foreground text-base tabular-nums')}>
                    {value(row.b, row.unit)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
