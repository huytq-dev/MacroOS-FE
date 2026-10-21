import type { NutrientInfo } from '../nutrient-detail.utils'
import type { NutrientTimingBucket } from '../types/nutrient-detail.types'

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const HOUR_LABELS = [
  { hour: 0, text: '12a' },
  { hour: 6, text: '6a' },
  { hour: 12, text: '12p' },
  { hour: 18, text: '6p' },
] as const
/** Chiều cao mẫu (%) của các cột mờ khi chưa có dữ liệu để vẽ. */
const PLACEHOLDER = [
  30, 45, 90, 70, 20, 10, 85, 60, 95, 72, 80, 100, 66, 40, 20, 85, 55, 28, 46, 70, 35, 58, 25, 62,
]

/**
 * "Nutrient Timing": 24 cột theo giờ trong ngày, màu của chất, cao theo lượng ăn vào ở giờ đó (cột mọc lên từ đáy). Chưa có gì để vẽ
 * thì là các cột mờ mẫu kèm "Nothing to plot yet".
 */
export function NutrientTiming({
  info,
  timing,
}: {
  readonly info: NutrientInfo
  readonly timing: readonly NutrientTimingBucket[]
}) {
  const byHour = new Map(timing.map((bucket) => [bucket.hour, bucket.amount]))
  const peak = Math.max(0, ...timing.map((bucket) => bucket.amount))
  const empty = peak <= 0
  return (
    <div className="bg-card rounded-xl p-4">
      <div className="relative">
        <div
          role="img"
          aria-label={empty ? 'No timing data yet' : `${info.nutrient.name} by hour`}
          className="flex h-44 items-end gap-1"
        >
          {HOURS.map((hour) => {
            const percent = empty ? PLACEHOLDER[hour] : ((byHour.get(hour) ?? 0) / peak) * 100
            return (
              <span
                key={hour}
                className="motion-safe:animate-chart-rise block flex-1 rounded-t-sm"
                style={{
                  height: `${percent > 0 && !empty ? Math.max(percent, 1.5) : percent}%`,
                  backgroundColor: empty ? 'var(--foreground)' : info.color,
                  opacity: empty ? 0.06 : 1,
                }}
              />
            )
          })}
        </div>
        {empty && (
          <p className="text-muted-foreground absolute inset-0 flex items-center justify-center text-base font-semibold">
            Nothing to plot yet
          </p>
        )}
      </div>
      <div className="text-muted-foreground relative mt-2 h-5 text-sm">
        {HOUR_LABELS.map((label) => (
          <span
            key={label.hour}
            className="absolute -translate-x-1/2"
            style={{ left: `${((label.hour + 0.5) / 24) * 100}%` }}
          >
            {label.text}
          </span>
        ))}
      </div>
    </div>
  )
}
