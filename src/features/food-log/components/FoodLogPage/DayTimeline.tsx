import { useRef } from 'react'
import { Plus } from 'lucide-react'
import { MEAL_DEFAULT_TIME } from '@/config/enums'
import { cn } from '@/lib/utils'
import { servingAmountLabel } from '@/features/foods/types/food.types'
import type { FoodLogEntry } from '../../types/food-log.types'
import { FoodTile, type FoodTileData, type FoodTileSettings } from './FoodTile'

interface DayTimelineProps {
  readonly entries: readonly FoodLogEntry[]
  /** Khoảng giờ hiển thị (cài đặt Hour Range); kéo dài ra nếu có món ngoài khoảng. */
  readonly firstHour: number
  readonly lastHour: number
  /** Giờ hiện tại khi đang xem hôm nay (hiện chấm cạnh giờ); null = không phải hôm nay. */
  readonly currentHour: number | null
  readonly showTimestamps: boolean
  readonly showHourlyTotals: boolean
  /** Căn phải: viên thuốc giờ nằm bên phải, đường dọc chạy bên phải. */
  readonly alignRight: boolean
  /** Nhấn giữ viên thuốc giờ để thêm món (thay cho nút + cạnh giờ). */
  readonly longPressToAdd: boolean
  readonly tileSettings: FoodTileSettings
  readonly onAddAt: (time: string) => void
  readonly onSelectEntry: (entry: FoodLogEntry) => void
}

const pad = (hour: number) => String(hour).padStart(2, '0')

const PILL =
  'bg-secondary flex h-9 w-[4.5rem] shrink-0 items-center justify-center gap-1 rounded-full text-sm font-medium tabular-nums'

const LONG_PRESS_MS = 500

/** Viên thuốc giờ; chấm bên cạnh cho giờ hiện tại, nhấn giữ (0.5 giây) để thêm món khi cài đặt long-press bật. */
function HourPill({
  label,
  now,
  onLongPress,
}: {
  readonly label: string
  readonly now: boolean
  readonly onLongPress?: () => void
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  const content = (
    <>
      {label}
      {now && <span aria-label="Now" className="bg-foreground size-1.5 rounded-full" />}
    </>
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

/** Giờ ăn của món: `eatenAt` (HH:mm:ss) hoặc giờ gợi ý của bữa khi chưa có. */
const timeOfEntry = (entry: FoodLogEntry) =>
  (entry.eatenAt ?? MEAL_DEFAULT_TIME[entry.mealType]).slice(0, 5)
const hourOfEntry = (entry: FoodLogEntry) => Number(timeOfEntry(entry).slice(0, 2))

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
  showTimestamps,
  showHourlyTotals,
  alignRight,
  longPressToAdd,
  tileSettings,
  onAddAt,
  onSelectEntry,
}: DayTimelineProps) {
  const first = Math.min(firstHour, ...entries.map(hourOfEntry))
  const last = Math.max(lastHour, ...entries.map(hourOfEntry))
  const hours = Array.from({ length: last - first + 1 }, (_, index) => first + index)

  return (
    <ol aria-label="Food log timeline" className="relative">
      {hours.map((hour) => {
        const here = entries.filter((entry) => hourOfEntry(entry) === hour)
        const total = (pick: (entry: FoodLogEntry) => number) =>
          Math.round(here.reduce((sum, entry) => sum + pick(entry), 0))
        return (
          <li
            key={hour}
            className={cn('relative flex items-start gap-3 py-2', alignRight && 'flex-row-reverse')}
          >
            <HourPill
              label={`${pad(hour)}:00`}
              now={hour === currentHour}
              onLongPress={longPressToAdd ? () => onAddAt(`${pad(hour)}:00`) : undefined}
            />
            {!longPressToAdd && (
              <button
                type="button"
                aria-label={`Add food at ${pad(hour)}:00`}
                onClick={() => onAddAt(`${pad(hour)}:00`)}
                className="bg-secondary active:bg-muted focus-visible:ring-ring/50 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                <Plus aria-hidden="true" className="size-5" />
              </button>
            )}
            {here.length > 0 && (
              <div className="min-w-0 flex-1 space-y-2">
                {showHourlyTotals && (
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {total((entry) => entry.calories)} kcal · P {total((entry) => entry.protein)} ·
                    C {total((entry) => entry.carbs)} · F {total((entry) => entry.fat)}
                  </p>
                )}
                <ul className="space-y-2">
                  {here.map((entry) => (
                    <li key={entry.id}>
                      {showTimestamps && (
                        <p className="text-muted-foreground mb-1 text-sm tabular-nums">
                          {timeOfEntry(entry)}
                        </p>
                      )}
                      <FoodTile
                        food={tileDataOf(entry)}
                        settings={tileSettings}
                        onSelect={() => onSelectEntry(entry)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
