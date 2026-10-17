'use client'

import { useState } from 'react'
import { SheetFrame } from './SheetFrame'
import { TileThumb } from './TileThumb'
import {
  NUTRIENT_DISPLAYS,
  NUTRIENT_DISPLAY_LABEL,
  type NutrientDisplay,
  type SectionDef,
} from '../../dashboard-layout'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface TilePickerSheetProps {
  readonly section: SectionDef | null
  readonly selected: readonly string[]
  /** Chỉ gọi khi bấm "Xong": danh sách ô cuối cùng của nhóm (ô giữ lại giữ nguyên thứ tự, ô mới thêm xuống cuối). */
  readonly onApply: (tiles: string[]) => void
  readonly onClose: () => void
}

/**
 * Bảng "Thêm hoặc bớt ô": công tắc chỉ đổi bản nháp trong bảng; Dashboard/màn tuỳ chỉnh chỉ đổi khi bấm "Xong",
 * đóng bằng X (hoặc vuốt/Esc) thì bỏ các thay đổi trong bảng.
 */
export function TilePickerSheet({ section, selected, onApply, onClose }: TilePickerSheetProps) {
  const [draft, setDraft] = useState<string[]>([])
  const [forKey, setForKey] = useState<string | null>(null)
  // Giữ nhóm vừa đóng để nội dung còn nguyên trong lúc bảng trượt xuống (không bị xoá trước khi hoạt ảnh đóng xong)
  const [shown, setShown] = useState<SectionDef | null>(null)
  // Mở một nhóm mới thì nạp bản nháp từ danh sách đang có (đặt lại ngay trong lúc render, không qua effect)
  if (section && forKey !== section.key) {
    setForKey(section.key)
    setShown(section)
    setDraft([...selected])
  } else if (!section && forKey !== null) {
    setForKey(null)
  }
  const toggle = (key: string, on: boolean) =>
    setDraft((list) => (on ? [...list, key] : list.filter((item) => item !== key)))

  return (
    <SheetFrame
      open={section !== null}
      onOpenChange={(open) => !open && onClose()}
      onDone={() => onApply(draft)}
      title={shown?.title ?? ''}
      subtitle="Add or remove tiles"
    >
      {shown?.groups.map((group) => (
        <div key={group.title ?? 'all'} className="pb-2">
          {group.title && <h3 className="px-4 pt-4 pb-1 text-xl font-semibold">{group.title}</h3>}
          <ul>
            {group.tiles.map((tile, index) => {
              const on = draft.includes(tile.key)
              return (
                <li key={tile.key} className="flex items-center gap-4 pl-4">
                  <TileThumb kind={tile.thumb} color={tile.color} />
                  <div
                    className={cn(
                      'border-border flex min-h-[3.75rem] flex-1 items-center justify-between gap-3 pr-4',
                      index > 0 && 'border-t'
                    )}
                  >
                    <span className="text-lg">{tile.label}</span>
                    <Switch
                      checked={on}
                      onCheckedChange={(next) => toggle(tile.key, next)}
                      aria-label={`Show ${tile.label}`}
                      className="h-8! w-14! data-[state=checked]:bg-white! data-[state=unchecked]:bg-zinc-600! [&>span]:size-7! [&>span]:bg-black! [&>span]:data-[state=checked]:translate-x-[26px]!"
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </SheetFrame>
  )
}

interface DisplaySheetProps {
  readonly open: boolean
  readonly value: NutrientDisplay
  readonly onChange: (value: NutrientDisplay) => void
  readonly onClose: () => void
}

/** Bảng "Hiển thị dưỡng chất": chọn Phần trăm / Đã ăn / Còn lại cho một ô dinh dưỡng; chọn xong đóng ngay. */
export function DisplaySheet({ open, value, onChange, onClose }: DisplaySheetProps) {
  return (
    <SheetFrame
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Nutrient Display"
      showDone={false}
    >
      <div role="radiogroup" aria-label="Nutrient Display" className="pb-6">
        {NUTRIENT_DISPLAYS.map((option, index) => {
          const selected = option === value
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                onChange(option)
                onClose()
              }}
              className={cn(
                'focus-visible:ring-ring/50 mx-4 flex min-h-16 w-[calc(100%-2rem)] items-center justify-between text-left text-lg focus-visible:ring-1 focus-visible:outline-none',
                index > 0 && 'border-border border-t'
              )}
            >
              {NUTRIENT_DISPLAY_LABEL[option]}
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
  )
}
