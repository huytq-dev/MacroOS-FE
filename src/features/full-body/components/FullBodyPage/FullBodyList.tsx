'use client'

import { useEffect, useState } from 'react'
import type { FullBodyHistoryItem } from '@/features/shortcuts/types/body-metrics.types'
import { formatWeekdayMonthDay } from '@/lib/week'
import { cn } from '@/lib/utils'
import { groupByMonth } from '../../full-body.utils'

/** Thời gian hàng bị xoá co lại trước khi gỡ khỏi danh sách (khớp `duration-300`). */
const LEAVE_MS = 300

interface FullBodyListProps {
  readonly items: readonly FullBodyHistoryItem[]
  readonly onOpen: (date: string) => void
}

type Row = FullBodyHistoryItem & { readonly leaving?: boolean }

/**
 * Danh sách ngày có số đo, nhóm theo tháng ("October 2026"): mỗi hàng "N metrics" + ngày ("Fri, Oct 16"), bấm để sửa.
 * Hàng mới trượt/hiện dần; hàng bị xoá được giữ thêm 300ms để co chiều cao về 0 rồi mới gỡ.
 */
export function FullBodyList({ items, onOpen }: FullBodyListProps) {
  const [rows, setRows] = useState<readonly Row[]>(items)
  const [previous, setPrevious] = useState(items)
  if (previous !== items) {
    // Cập nhật ngay trong render (không qua effect) để hàng mới không chớp; ngày biến mất được đánh dấu leaving
    setPrevious(items)
    const current = new Set(items.map((item) => item.date))
    const leaving = rows
      .filter((row) => !current.has(row.date))
      .map((row) => ({ ...row, leaving: true }))
    setRows([...items, ...leaving].sort((left, right) => (left.date < right.date ? 1 : -1)))
  }

  useEffect(() => {
    if (!rows.some((row) => row.leaving)) return
    const timer = setTimeout(
      () => setRows((current) => current.filter((row) => !row.leaving)),
      LEAVE_MS
    )
    return () => clearTimeout(timer)
  }, [rows])

  return (
    <div className="space-y-6">
      {groupByMonth(rows).map((group) => (
        <section key={group.label} aria-label={group.label} className="space-y-2">
          <h2 className="text-xl font-semibold">{group.label}</h2>
          <ul className="bg-card overflow-hidden rounded-xl">
            {group.items.map((item, index) => {
              const leaving = (item as Row).leaving
              return (
                <li
                  key={item.date}
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  className={cn(
                    'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-both grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-safe:duration-300 motion-reduce:transition-none',
                    leaving ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                  )}
                >
                  <div className="overflow-hidden">
                    <button
                      type="button"
                      disabled={leaving}
                      onClick={() => onOpen(item.date)}
                      className={cn(
                        'active:bg-muted focus-visible:ring-ring/50 flex w-full pl-4 text-left transition-colors focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset'
                      )}
                    >
                      {/* Đường kẻ thụt vào từ trái, chạy tới mép phải như MacroFactor */}
                      <span
                        className={cn(
                          'flex min-h-12 flex-1 items-center gap-3 pr-4',
                          index > 0 && 'border-border border-t'
                        )}
                      >
                        <span className="flex-1 text-base">
                          {item.metricCount} {item.metricCount === 1 ? 'metric' : 'metrics'}
                        </span>
                        <span className="text-muted-foreground text-base">
                          {formatWeekdayMonthDay(item.date)}
                        </span>
                      </span>
                    </button>
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
