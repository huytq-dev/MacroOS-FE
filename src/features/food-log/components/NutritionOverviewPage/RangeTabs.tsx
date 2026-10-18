'use client'

import {
  OVERVIEW_RANGES,
  OVERVIEW_RANGE_LABEL,
  type OverviewRange,
} from '../../nutrition-overview.utils'
import { cn } from '@/lib/utils'

interface RangeTabsProps {
  readonly value: OverviewRange
  readonly onChange: (range: OverviewRange) => void
}

/** Năm tab kỳ (Today → 1 Year) chia đều bề ngang; vạch trắng trượt (300ms) dưới tab đang chọn trên đường kẻ xám. */
export function RangeTabs({ value, onChange }: RangeTabsProps) {
  const index = OVERVIEW_RANGES.indexOf(value)
  return (
    <div>
      <div role="tablist" aria-label="Period" className="grid grid-cols-5">
        {OVERVIEW_RANGES.map((range) => (
          <button
            key={range}
            type="button"
            role="tab"
            aria-selected={range === value}
            onClick={() => onChange(range)}
            className={cn(
              'focus-visible:ring-ring/50 min-h-12 text-sm whitespace-nowrap transition-colors duration-300 focus-visible:ring-1 focus-visible:outline-none',
              range === value ? 'text-foreground font-semibold' : 'text-muted-foreground'
            )}
          >
            {OVERVIEW_RANGE_LABEL[range]}
          </button>
        ))}
      </div>
      <div className="bg-border relative h-1">
        <span
          aria-hidden="true"
          style={{ transform: `translateX(${index * 100}%)` }}
          className="bg-foreground absolute inset-y-0 left-0 w-1/5 transition-transform duration-300 ease-out motion-reduce:transition-none"
        />
      </div>
    </div>
  )
}
