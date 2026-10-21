interface HabitSummaryProps {
  /** Giá trị hôm nay (kg hoặc kcal); null = chưa có, hiện "--". */
  readonly todayValue: number | null
  readonly unit: string
  readonly streak: number
}

/** Hai số đầu trang Habits: "Today -- kg" và "Streak 1 day" (số ít / số nhiều đúng tiếng Anh). */
export function HabitSummary({ todayValue, unit, streak }: HabitSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-muted-foreground text-sm">Today</p>
        <p
          key={todayValue ?? 'none'}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 text-3xl tabular-nums"
        >
          {todayValue === null ? '--' : Number(todayValue.toFixed(1)).toLocaleString('en-US')}
          <span className="text-muted-foreground ml-1.5 text-lg">{unit}</span>
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-sm">Streak</p>
        <p
          key={streak}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:animation-duration-300 text-3xl tabular-nums"
        >
          {streak}
          <span className="text-muted-foreground ml-1.5 text-lg">
            {streak === 1 ? 'day' : 'days'}
          </span>
        </p>
      </div>
    </div>
  )
}

/** Chú giải gọn dưới lịch: vòng xanh = Tracked, vòng xám mảnh = Untracked (không đóng khung riêng). */
export function HabitLegend({ trackedBorder = 'border-mf-tile-carbs' }: { readonly trackedBorder?: string }) {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-8 text-sm">
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className={`${trackedBorder} size-3.5 rounded-full border-2`} />
        Tracked
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="border-border size-3.5 rounded-full border" />
        Untracked
      </span>
    </div>
  )
}
