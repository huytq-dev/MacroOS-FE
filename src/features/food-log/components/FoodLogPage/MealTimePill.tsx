interface MealTimePillProps {
  /** Giờ ăn dạng HH:mm (24 giờ). */
  readonly time: string
  /** Tên bữa suy ra từ giờ, hiện nhỏ dưới giờ. */
  readonly mealLabel: string
  readonly onTimeChange: (time: string) => void
}

/**
 * Ô giờ ăn kiểu MacroFactor ("12 PM"): hiện giờ + tên bữa; `<input type="time">` trong suốt phủ lên để
 * mở bộ chọn giờ native của iOS. Đổi giờ thì bữa tự đổi theo (mealForHour ở trang).
 */
export function MealTimePill({ time, mealLabel, onTimeChange }: MealTimePillProps) {
  return (
    <label className="bg-secondary focus-within:ring-ring/50 relative flex h-11 shrink-0 cursor-pointer flex-col items-center justify-center rounded-full px-4 transition-colors focus-within:ring-1 active:opacity-70">
      <span className="text-base leading-none font-semibold tabular-nums">{time}</span>
      <span className="text-muted-foreground mt-0.5 text-xs leading-none">{mealLabel}</span>
      <input
        type="time"
        value={time}
        aria-label="Giờ ăn"
        onChange={(event) => event.target.value && onTimeChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  )
}
