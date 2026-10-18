interface MealTimePillProps {
  /** Giờ ăn dạng HH:mm (24 giờ). */
  readonly time: string
  /** Tên bữa suy ra từ giờ, hiện nhỏ dưới giờ. */
  readonly mealLabel: string
  readonly onClick: () => void
}

/** Ô giờ ăn kiểu MacroFactor: hiện giờ + tên bữa; bấm mở bảng Select Date and Time (đổi giờ thì bữa tự đổi theo ở trang). */
export function MealTimePill({ time, mealLabel, onClick }: MealTimePillProps) {
  return (
    <button
      type="button"
      aria-label={`${mealLabel} at ${time}, change date and time`}
      onClick={onClick}
      className="bg-secondary focus-visible:ring-ring/50 active:bg-muted flex h-11 shrink-0 items-center justify-center rounded-full px-4 text-base font-medium tabular-nums transition-[background-color,transform] duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
    >
      {time}
    </button>
  )
}
