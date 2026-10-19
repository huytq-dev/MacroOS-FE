'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SheetFrame } from '@/components/shared/SheetFrame'
import {
  AVERAGINGS,
  AVERAGING_LABEL,
  RANGES,
  type Averaging,
  type RangeKey,
} from '../../expenditure.utils'
import { cn } from '@/lib/utils'

interface RangeBarProps {
  readonly range: RangeKey
  readonly onRangeChange: (range: RangeKey) => void
  readonly averaging: Averaging
  readonly onAveragingChange: (averaging: Averaging) => void
}

/** Thanh chọn kỳ (1W…All) dạng viên thuốc, kèm nút "D ▾" mở bảng Chart Averaging (chọn một: chọn xong đóng ngay). */
export function RangeBar({ range, onRangeChange, averaging, onAveragingChange }: RangeBarProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Chart range"
        className="bg-secondary relative flex flex-1 items-center justify-between rounded-full p-1"
      >
        <span
          aria-hidden="true"
          style={{
            width: `calc((100% - 0.5rem) / ${RANGES.length})`,
            transform: `translateX(${RANGES.indexOf(range) * 100}%)`,
          }}
          className="bg-foreground absolute inset-y-1 left-1 rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
        />
        {RANGES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === range}
            onClick={() => onRangeChange(option)}
            className={cn(
              'focus-visible:ring-ring/50 relative h-11 flex-1 rounded-full text-base transition-colors duration-300 focus-visible:ring-1 focus-visible:outline-none',
              option === range ? 'text-background font-medium' : 'text-foreground'
            )}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Chart averaging"
        onClick={() => setOpen(true)}
        className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex h-12 shrink-0 items-center gap-1.5 rounded-full px-4 text-base focus-visible:ring-1 focus-visible:outline-none"
      >
        {averaging[0].toUpperCase()}
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>

      <SheetFrame open={open} onOpenChange={setOpen} title="Chart Averaging" showDone={false}>
        <div role="radiogroup" aria-label="Chart averaging" className="pb-6">
          {AVERAGINGS.map((option, index) => {
            const selected = option === averaging
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  onAveragingChange(option)
                  setOpen(false)
                }}
                className={cn(
                  'focus-visible:ring-ring/50 mx-4 flex min-h-16 w-[calc(100%-2rem)] items-center justify-between text-left text-lg focus-visible:ring-1 focus-visible:outline-none',
                  index > 0 && 'border-border border-t'
                )}
              >
                {AVERAGING_LABEL[option]}
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full border-2',
                    selected ? 'border-white bg-white' : 'border-zinc-600'
                  )}
                >
                  {selected && <span className="size-2 rounded-full bg-black" />}
                </span>
              </button>
            )
          })}
        </div>
      </SheetFrame>
    </div>
  )
}
