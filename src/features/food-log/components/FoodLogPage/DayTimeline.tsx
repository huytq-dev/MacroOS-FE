import { useRef } from 'react'
import { Check, ClipboardPaste, Flame, Plus } from 'lucide-react'
import { MEAL_DEFAULT_TIME } from '@/config/enums'
import { CollapseItem } from '@/components/shared/CollapseItem'
import { useExitingList } from '@/hooks/use-exiting-list'
import { cn } from '@/lib/utils'
import { servingAmountLabel } from '@/features/foods/types/food.types'
import type { SelectionMode } from '../../hooks/use-timeline-selection'
import type { FoodLogEntry } from '../../types/food-log.types'
import { FoodTile, type FoodTileData, type FoodTileSettings } from './FoodTile'

/** Chế độ chọn nhiều món (như MacroFactor): khi có `mode`, bấm món / viên thuốc giờ chỉ đổi lựa chọn, copy mode thì nút + thành nút dán. */
export interface TimelineSelection {
  readonly mode: SelectionMode | null
  readonly selected: ReadonlySet<string>
  /** Bấm viên thuốc giờ (hoặc nhấn giữ một món) khi chưa chọn gì: vào chế độ chọn với các món này. */
  readonly onStart: (ids: readonly string[]) => void
  readonly onToggleEntry: (id: string) => void
  /** Bấm viên thuốc giờ khi đang chọn: chọn / bỏ chọn cả giờ. */
  readonly onToggleHour: (ids: readonly string[]) => void
  /** Dán vào giờ này (HH:mm) ở chế độ Copy / Multi-Paste. */
  readonly onPaste: (time: string) => void
}

interface DayTimelineProps {
  readonly entries: readonly FoodLogEntry[]
  /** Khoảng giờ hiển thị (cài đặt Hour Range); kéo dài ra nếu có món ngoài khoảng. */
  readonly firstHour: number
  readonly lastHour: number
  /** Giờ hiện tại khi đang xem hôm nay (hiện chấm cạnh giờ); null = không phải hôm nay. */
  readonly currentHour: number | null
  /** Hide Empty Hours: chỉ hiện giờ có món (và giờ hiện tại, giờ cuối để còn nút +). */
  readonly hideEmptyHours: boolean
  readonly showTimestamps: boolean
  readonly showHourlyTotals: boolean
  /** Căn phải: viên thuốc giờ nằm bên phải, đường dọc chạy bên phải. */
  readonly alignRight: boolean
  /** Nhấn giữ viên thuốc giờ để thêm món (thay cho nút + cạnh giờ). */
  readonly longPressToAdd: boolean
  readonly tileSettings: FoodTileSettings
  readonly onAddAt: (time: string) => void
  readonly onSelectEntry: (entry: FoodLogEntry) => void
  readonly selection?: TimelineSelection
}

const pad = (hour: number) => String(hour).padStart(2, '0')

const PILL =
  'bg-secondary relative z-10 flex h-9 w-[4.5rem] shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums'

const LONG_PRESS_MS = 500

/** Viên thuốc giờ; chấm bên cạnh cho giờ hiện tại, nhấn giữ (0.5 giây) để thêm món khi cài đặt long-press bật. */
function HourPill({
  label,
  now,
  onLongPress,
  onPress,
  filled = false,
}: {
  readonly label: string
  readonly now: boolean
  readonly onLongPress?: () => void
  /** Giờ có món: bấm để vào / đổi lựa chọn cả giờ; `filled` = đã chọn đủ (nền trắng). */
  readonly onPress?: () => void
  readonly filled?: boolean
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  const content = (
    <>
      {label}
      {now && (
        <span
          aria-label="Now"
          className={cn(
            'absolute top-1/2 left-2 size-1.5 -translate-y-1/2 rounded-full transition-colors duration-200',
            filled ? 'bg-background' : 'bg-foreground'
          )}
        />
      )}
    </>
  )
  if (onPress)
    return (
      <button
        type="button"
        aria-pressed={filled}
        aria-label={`Select foods at ${label}`}
        onClick={onPress}
        className={cn(
          PILL,
          'focus-visible:ring-ring/50 transition-[background-color,color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100',
          filled ? 'bg-foreground text-background' : 'active:bg-muted'
        )}
      >
        {content}
      </button>
    )
  return onLongPress ? (
    <button
      type="button"
      aria-label={`Hold to add food at ${label}`}
      onPointerDown={() => {
        cancel()
        timer.current = setTimeout(onLongPress, LONG_PRESS_MS)
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        PILL,
        'active:bg-muted focus-visible:ring-ring/50 touch-none select-none focus-visible:ring-1 focus-visible:outline-none'
      )}
    >
      {content}
    </button>
  ) : (
    <span className={PILL}>{content}</span>
  )
}

/** Vòng chọn bên phải mỗi món khi đang chọn nhiều: rỗng = ○, đã chọn = ✓; hiện ra bằng phóng nhẹ 200ms (tắt khi giảm chuyển động). */
function SelectCheck({
  selected,
  label,
  onToggle,
}: {
  readonly selected: boolean
  readonly label: string
  readonly onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`Select ${label}`}
      onClick={onToggle}
      className="focus-visible:ring-ring/50 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in-0 motion-safe:animation-duration-200 relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:ring-1 focus-visible:outline-none"
    >
      <span
        className={cn(
          'border-foreground flex size-7 items-center justify-center rounded-full border-2 transition-[background-color,transform] duration-200 active:scale-90 motion-reduce:active:scale-100',
          selected ? 'bg-background' : 'bg-transparent'
        )}
      >
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className={cn(
            'size-4 transition-[opacity,transform] duration-200',
            selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          )}
        />
      </span>
    </button>
  )
}

/** Giờ ăn của món: `eatenAt` (HH:mm:ss) hoặc giờ gợi ý của bữa khi chưa có. */
const timeOfEntry = (entry: FoodLogEntry) =>
  (entry.eatenAt ?? MEAL_DEFAULT_TIME[entry.mealType]).slice(0, 5)
const hourOfEntry = (entry: FoodLogEntry) => Number(timeOfEntry(entry).slice(0, 2))
/** Giờ trên đường dọc không đệm số 0 đầu: "7:00", "12:47". */
const clockOfEntry = (entry: FoodLogEntry) => {
  const [hour, minute] = timeOfEntry(entry).split(':')
  return `${Number(hour)}:${minute}`
}

/** Huy hiệu tròn (chữ cái hoặc icon) + số: một ô của dòng tổng macro theo giờ. */
function TotalBadge({ label, value }: { readonly label: React.ReactNode; readonly value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      >
        {label}
      </span>
      <span className="text-base tabular-nums">{value}</span>
    </span>
  )
}

/** Tổng calo và macro của một giờ: "🔥 156  P 11  F 0  C 31". */
function HourTotals({
  calories,
  protein,
  fat,
  carbs,
  className,
}: {
  readonly calories: number
  readonly protein: number
  readonly fat: number
  readonly carbs: number
  readonly className?: string
}) {
  return (
    <p
      className={cn('flex items-center justify-between', className)}
      aria-label={`${calories} kcal, ${protein} protein, ${fat} fat, ${carbs} carbs`}
    >
      <TotalBadge
        label={<Flame aria-hidden="true" fill="currentColor" className="size-3.5" />}
        value={calories}
      />
      <TotalBadge label="P" value={protein} />
      <TotalBadge label="F" value={fat} />
      <TotalBadge label="C" value={carbs} />
    </p>
  )
}

/** Dữ liệu ô món từ một dòng log: khẩu phần ("1 cup" hoặc gram) và khối lượng (BE trả `weightGrams`, log theo gram thì chính là số lượng). */
const tileDataOf = (entry: FoodLogEntry): FoodTileData => {
  const grams = entry.weightGrams ?? (entry.servingName ? null : entry.quantity)
  return {
    name: entry.foodName,
    calories: entry.calories,
    protein: entry.protein,
    fat: entry.fat,
    carbs: entry.carbs,
    servingText: entry.servingName
      ? servingAmountLabel(entry.quantity, entry.servingName)
      : `${entry.quantity} g`,
    weightText: grams === null ? null : `${Math.round(grams)} g`,
    emoji: entry.emoji ?? null,
    iconKey: entry.iconKey ?? null,
  }
}

/**
 * Dòng thời gian trong ngày: mỗi giờ một viên thuốc giờ (không có đường dọc nối), nút + để thêm món vào đúng giờ đó, các món đã
 * log hiện bên phải giờ của chúng (chạm để sửa). Khoảng giờ, mốc giờ ăn và tổng macro theo giờ theo cài đặt Food Log.
 */
export function DayTimeline({
  entries,
  firstHour,
  lastHour,
  currentHour,
  hideEmptyHours,
  showTimestamps,
  showHourlyTotals,
  alignRight,
  longPressToAdd,
  tileSettings,
  onAddAt,
  onSelectEntry,
  selection,
}: DayTimelineProps) {
  const selecting = selection?.mode != null
  // Copy / Multi-Paste: nút + của mỗi giờ thành nút dán
  const pasteMode = selection?.mode === 'copy' || selection?.mode === 'paste'
  // Nhấn giữ một món (0.5 giây) khi chưa chọn gì: vào chế độ chọn với món đó, lần nhả sau đó không tính là bấm sửa
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const held = useRef(false)
  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    holdTimer.current = null
  }
  // Món vừa xoá còn giữ 300ms để co lại rồi mới biến mất; món mới thêm trượt vào
  const rows = useExitingList(entries, (entry) => entry.id)
  const first = Math.min(firstHour, ...rows.map((row) => hourOfEntry(row.item)))
  const last = Math.max(lastHour, ...rows.map((row) => hourOfEntry(row.item)))
  const hours = Array.from({ length: last - first + 1 }, (_, index) => first + index)

  return (
    <ol aria-label="Food log timeline" className="relative">
      <span
        aria-hidden="true"
        className={cn(
          'bg-foreground/20 absolute inset-y-2 w-px',
          alignRight ? 'right-9' : 'left-9'
        )}
      />
      {hours.map((hour) => {
        const hereRows = rows.filter((row) => hourOfEntry(row.item) === hour)
        // Tổng và số món (quyết định hiện viên thuốc giờ) chỉ tính món còn sống; món đang co lại chỉ giữ chỗ
        const here = hereRows.filter((row) => !row.leaving).map((row) => row.item)
        if (hideEmptyHours && hereRows.length === 0 && hour !== currentHour && hour !== last)
          return null
        // Giờ chỉ có một món thì món đứng riêng trên đường dọc (như MacroFactor); viên thuốc giờ và tổng chỉ hiện ở giờ trống,
        // giờ hiện tại (để còn chỗ thêm món) hoặc giờ có từ hai món trở lên.
        // Đang chọn: giờ có món nào cũng hiện viên thuốc để chọn / bỏ chọn cả giờ.
        const showHeader =
          here.length === 0 || here.length >= 2 || hour === currentHour || selecting
        const hereIds = here.map((entry) => entry.id)
        const allSelected =
          selecting && hereIds.length > 0 && hereIds.every((id) => selection?.selected.has(id))
        const sum = (pick: (entry: FoodLogEntry) => number) =>
          Math.round(here.reduce((total, entry) => total + pick(entry), 0))
        return (
          <li key={hour} id={`timeline-hour-${hour}`}>
            {showHeader && (
              <div className={cn('flex items-center gap-3 py-2', alignRight && 'flex-row-reverse')}>
                <HourPill
                  label={`${pad(hour)}:00`}
                  now={hour === currentHour}
                  onLongPress={longPressToAdd ? () => onAddAt(`${pad(hour)}:00`) : undefined}
                  onPress={
                    selection && hereIds.length > 0
                      ? () =>
                          selecting ? selection.onToggleHour(hereIds) : selection.onStart(hereIds)
                      : undefined
                  }
                  filled={allSelected}
                />
                {pasteMode && selection ? (
                  <button
                    type="button"
                    aria-label={`Paste foods at ${pad(hour)}:00`}
                    onClick={() => selection.onPaste(`${pad(hour)}:00`)}
                    className="bg-secondary active:bg-muted focus-visible:ring-ring/50 motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:fade-in-0 relative flex size-9 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-200 before:absolute before:-inset-1 before:content-[''] focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
                  >
                    <ClipboardPaste aria-hidden="true" className="size-5" />
                  </button>
                ) : (
                  !longPressToAdd && (
                    <button
                      type="button"
                      aria-label={`Add food at ${pad(hour)}:00`}
                      onClick={() => onAddAt(`${pad(hour)}:00`)}
                      className="bg-secondary active:bg-muted focus-visible:ring-ring/50 relative flex size-9 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-200 before:absolute before:-inset-1 before:content-[''] focus-visible:ring-1 focus-visible:outline-none active:scale-90 motion-reduce:active:scale-100"
                    >
                      <Plus aria-hidden="true" className="size-5" />
                    </button>
                  )
                )}
                {here.length > 0 && showHourlyTotals && (
                  <HourTotals
                    calories={sum((entry) => entry.calories)}
                    protein={sum((entry) => entry.protein)}
                    fat={sum((entry) => entry.fat)}
                    carbs={sum((entry) => entry.carbs)}
                    className="min-w-0 flex-1 px-1"
                  />
                )}
              </div>
            )}
            {hereRows.length > 0 && (
              <ul>
                {hereRows.map(({ item: entry, key, entering, leaving }) => (
                  <CollapseItem key={key} entering={entering} leaving={leaving}>
                    <div
                      className={cn(
                        'flex items-center gap-3 py-1',
                        alignRight && 'flex-row-reverse'
                      )}
                    >
                      <span
                        className={cn(
                          'relative z-10 flex w-[4.5rem] shrink-0 justify-center',
                          !showTimestamps && 'invisible'
                        )}
                      >
                        <span className="bg-background text-muted-foreground px-1 text-sm tabular-nums">
                          {clockOfEntry(entry)}
                        </span>
                      </span>
                      <div
                        className="min-w-0 flex-1"
                        onPointerDown={() => {
                          if (!selection || selecting) return
                          held.current = false
                          cancelHold()
                          holdTimer.current = setTimeout(() => {
                            held.current = true
                            selection.onStart([entry.id])
                          }, LONG_PRESS_MS)
                        }}
                        onPointerUp={cancelHold}
                        onPointerLeave={cancelHold}
                        onPointerCancel={cancelHold}
                        onClickCapture={(event) => {
                          if (!held.current) return
                          held.current = false
                          event.stopPropagation()
                          event.preventDefault()
                        }}
                      >
                        <FoodTile
                          food={tileDataOf(entry)}
                          settings={tileSettings}
                          dimEdit={selecting}
                          onSelect={() =>
                            selecting && selection
                              ? selection.onToggleEntry(entry.id)
                              : onSelectEntry(entry)
                          }
                        />
                      </div>
                      {selecting && selection && (
                        <SelectCheck
                          selected={selection.selected.has(entry.id)}
                          label={entry.foodName}
                          onToggle={() => selection.onToggleEntry(entry.id)}
                        />
                      )}
                    </div>
                  </CollapseItem>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}
