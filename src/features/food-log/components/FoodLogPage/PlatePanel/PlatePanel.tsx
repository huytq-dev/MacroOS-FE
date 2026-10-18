'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CollapseItem } from '@/components/shared/CollapseItem'
import { Button } from '@/components/ui/button'
import { useExitingList } from '@/hooks/use-exiting-list'
import type { ProgramWeek } from '@/features/program/types/program.types'
import { cn } from '@/lib/utils'
import type { MacroTotals, PlateItem } from '../../../types/food-log.types'
import { PlateItemRow } from './PlateItemRow'
import { PlateNutrition } from './PlateNutrition'

interface PlatePanelProps {
  /** Đang mở: nội dung trượt xuống + hiện dần; đóng thì trượt lên + mờ đi (bảng vẫn mount để hoạt ảnh đóng kịp chạy). */
  readonly open: boolean
  /** Ngày sẽ ghi (yyyy-MM-dd). */
  readonly date: string
  readonly plate: readonly PlateItem[]
  readonly plateTotals: MacroTotals
  readonly dayTotals?: MacroTotals
  readonly target?: ProgramWeek | null
  readonly isLogging: boolean
  readonly onRemove: (key: string) => void
  /** Nút Add của thẻ "plate trống": quay lại bảng tìm món. */
  readonly onAddFoods: () => void
  readonly onLog: () => void
}

/**
 * Bảng "Your Plate" mở bằng nút mũi tên cạnh viên thuốc plate: danh sách món đang chờ ghi (hoặc thẻ xanh "plate trống" có nút
 * Add), mục Nutrition của plate và nút Log Foods nổi ở góc phải dưới. Khi mở, tấm sheet tab thu xuống thành thanh nhỏ ở đáy.
 */
export function PlatePanel({
  open,
  date,
  plate,
  plateTotals,
  dayTotals,
  target,
  isLogging,
  onRemove,
  onAddFoods,
  onLog,
}: PlatePanelProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  // Món xoá khỏi plate co lại 300ms rồi mới biến mất
  const rows = useExitingList(plate, (item) => item.key)
  return (
    <div
      className={cn(
        'h-full overflow-y-auto overscroll-contain px-4 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
        open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      )}
    >
      <section aria-labelledby="your-plate" className="space-y-4 pt-4 pb-8">
        <h2 id="your-plate" className="text-xl font-bold">
          Your Plate
        </h2>
        {rows.length === 0 ? (
          <div className="flex items-center gap-4 rounded-xl bg-blue-950 px-4 py-4">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-950"
            >
              i
            </span>
            <p className="min-w-0 flex-1 text-base leading-snug">
              Your plate is empty
              <span className="block">Add foods using Search, Scan, or AI.</span>
            </p>
            <Button
              className="h-11 shrink-0 rounded-full bg-blue-700 px-5 text-base text-white hover:bg-blue-600"
              onClick={onAddFoods}
            >
              Add
            </Button>
          </div>
        ) : (
          <ul>
            {rows.map(({ item, key, entering, leaving }) => (
              <CollapseItem key={key} gap entering={entering} leaving={leaving}>
                <PlateItemRow
                  item={item}
                  expanded={expandedKey === item.key}
                  disabled={isLogging}
                  onToggle={() =>
                    setExpandedKey((current) => (current === item.key ? null : item.key))
                  }
                  onRemove={() => {
                    setExpandedKey(null)
                    onRemove(item.key)
                  }}
                />
              </CollapseItem>
            ))}
          </ul>
        )}
      </section>

      <PlateNutrition
        date={date}
        plate={plate}
        plateTotals={plateTotals}
        dayTotals={dayTotals}
        target={target}
      />

      <div className="sticky bottom-0 -mx-4 flex justify-end px-4 pt-6 pb-4">
        <Button
          className="h-14 rounded-full px-6 text-base shadow-lg"
          disabled={isLogging || plate.length === 0}
          aria-busy={isLogging}
          onClick={onLog}
        >
          {isLogging && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {isLogging ? 'Logging...' : 'Log Foods'}
        </Button>
      </div>
    </div>
  )
}
