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
import { PlateQuantityEditor } from './PlateQuantityEditor'
import { applyEdit, canEditItem, initialEdit, type PlateEdit } from './plate-edit.utils'

interface PlatePanelProps {
  /** Đang mở: nội dung trượt xuống + hiện dần; đóng thì trượt lên + mờ đi (bảng vẫn mount để hoạt ảnh đóng kịp chạy). */
  readonly open: boolean
  /** Ngày sẽ ghi (yyyy-MM-dd). */
  readonly date: string
  readonly plate: readonly PlateItem[]
  readonly plateTotals: MacroTotals
  readonly target?: ProgramWeek | null
  readonly isLogging: boolean
  readonly onRemove: (key: string) => void
  /** Lưu lượng mới của một dòng (nút Done của bàn phím sửa lượng). */
  readonly onUpdate: (item: PlateItem) => void
  /** Nút Add của thẻ "plate trống": quay lại bảng tìm món. */
  readonly onAddFoods: () => void
  /** Ghi plate; `items` có khi vừa sửa lượng một dòng (state plate chưa kịp cập nhật). */
  readonly onLog: (items?: PlateItem[]) => void
}

/**
 * Bảng "Your Plate" mở bằng nút mũi tên cạnh viên thuốc plate: danh sách món đang chờ ghi (hoặc thẻ xanh "plate trống" có nút
 * Add), mục Nutrition của plate và nút Log Foods nổi ở góc phải dưới. Bấm ô lượng của một dòng thì bàn phím số riêng (chip đơn vị +
 * Log Foods + Done) thay nút Log Foods; vuốt dòng sang trái để xoá. Khi mở, tấm sheet tab thu xuống thành thanh nhỏ ở đáy.
 */
export function PlatePanel({
  open,
  date,
  plate,
  plateTotals,
  target,
  isLogging,
  onRemove,
  onUpdate,
  onAddFoods,
  onLog,
}: PlatePanelProps) {
  const [editing, setEditing] = useState<{ key: string; edit: PlateEdit } | null>(null)
  // Món xoá khỏi plate co lại 300ms rồi mới biến mất
  const rows = useExitingList(plate, (item) => item.key)
  const editedItem = editing ? plate.find((item) => item.key === editing.key) : undefined
  // Đóng bảng hoặc món đang sửa đã biến mất: bỏ phiên sửa
  if (editing && (!open || !editedItem)) setEditing(null)
  const applied = editedItem && editing ? applyEdit(editedItem, editing.edit) : null

  const finish = () => {
    if (applied) onUpdate(applied)
    setEditing(null)
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
        open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
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
              {rows.map(({ item, key, entering, leaving }) => {
                const isEditing = editing?.key === item.key
                const serving =
                  isEditing && editing.edit.unit === 'serving'
                    ? item.servings?.find((candidate) => candidate.id === editing.edit.servingId)
                    : undefined
                return (
                  <CollapseItem key={key} gap entering={entering} leaving={leaving}>
                    <PlateItemRow
                      item={item}
                      disabled={isLogging}
                      editing={isEditing}
                      editText={isEditing ? editing.edit.text : ''}
                      editUnit={isEditing ? (serving ? serving.name : editing.edit.unit) : ''}
                      onEdit={
                        canEditItem(item) && !leaving
                          ? (button) => {
                              if (isEditing) return finish()
                              if (applied) onUpdate(applied)
                              setEditing({ key: item.key, edit: initialEdit(item) })
                              // Bàn phím trượt lên che nửa dưới: giữ dòng đang sửa trong vùng nhìn thấy
                              window.setTimeout(
                                () =>
                                  button.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
                                320
                              )
                            }
                          : undefined
                      }
                      onRemove={() => onRemove(item.key)}
                    />
                  </CollapseItem>
                )
              })}
            </ul>
          )}
        </section>

        <PlateNutrition date={date} plate={plate} plateTotals={plateTotals} target={target} />

        {!editing && (
          <div className="sticky bottom-0 -mx-4 flex justify-end px-4 pt-6 pb-4">
            <Button
              className="h-14 rounded-full px-6 text-base shadow-lg"
              disabled={isLogging || plate.length === 0}
              aria-busy={isLogging}
              onClick={() => onLog()}
            >
              {isLogging && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {isLogging ? 'Logging...' : 'Log Foods'}
            </Button>
          </div>
        )}
      </div>

      {editing && editedItem && (
        <PlateQuantityEditor
          item={editedItem}
          edit={editing.edit}
          valid={applied !== null}
          isLogging={isLogging}
          onChange={(edit) => setEditing({ key: editing.key, edit })}
          onDone={finish}
          onLog={() => {
            if (!applied) return
            onUpdate(applied)
            onLog(plate.map((item) => (item.key === applied.key ? applied : item)))
          }}
        />
      )}
    </div>
  )
}
