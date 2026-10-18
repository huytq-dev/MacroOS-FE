import { Skeleton } from '@/components/ui/skeleton'

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export interface ImpactItem {
  readonly key: string
  readonly label: string
  /** % lượng món so với mục tiêu ngày; null = chưa có mục tiêu. */
  readonly percent: number | null
  /** Màu cung tiến độ (lớp `stroke-*`). */
  readonly stroke: string
}

interface ImpactRingsProps {
  readonly items: readonly ImpactItem[]
  readonly isLoading: boolean
}

/** "Impact on Targets": bốn vòng tròn Calories / Protein / Fat / Carbs, % ở giữa, cung tiến độ màu tile tương ứng. */
export function ImpactRings({ items, isLoading }: ImpactRingsProps) {
  return (
    <ul className="grid grid-cols-4 gap-2">
      {items.map((item) => {
        const filled = Math.min(100, Math.max(0, item.percent ?? 0))
        return (
          <li key={item.key} className="flex flex-col items-center gap-2">
            {isLoading ? (
              <Skeleton className="size-16 rounded-full" aria-busy="true" />
            ) : (
              <div className="relative size-16">
                <svg viewBox="0 0 64 64" aria-hidden="true" className="size-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="6"
                    className="stroke-foreground/10"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - filled / 100)}
                    className={`${item.stroke} transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-medium tabular-nums">
                  {item.percent === null ? '–' : `${item.percent}%`}
                </span>
              </div>
            )}
            <span className="text-muted-foreground text-sm">{item.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
