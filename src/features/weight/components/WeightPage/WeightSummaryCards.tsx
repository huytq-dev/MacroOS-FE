import { Skeleton } from '@/components/ui/skeleton'
import type { WeightEntries } from '../../types/weight.types'

interface WeightSummaryCardsProps {
  readonly data?: WeightEntries
  readonly isLoading: boolean
}

const format = (value: number | null, suffix: string, signed = false) =>
  value === null ? '—' : `${signed && value > 0 ? '+' : ''}${value.toFixed(2)} ${suffix}`

export function WeightSummaryCards({ data, isLoading }: WeightSummaryCardsProps) {
  const cards = [
    { label: 'Cân gần nhất', value: format(data?.latestWeightKg ?? null, 'kg') },
    { label: 'Trend', value: format(data?.latestTrendKg ?? null, 'kg') },
    { label: 'Tốc độ 7 ngày', value: format(data?.rateKgPerWeek ?? null, 'kg/tuần', true) },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map((card) => (
        <div key={card.label} className="bg-card rounded-lg border px-3 py-2">
          <p className="text-muted-foreground text-[11px]">{card.label}</p>
          {isLoading ? <Skeleton className="mt-1 h-6 w-20" /> : <p className="text-lg font-semibold tabular-nums">{card.value}</p>}
        </div>
      ))}
    </div>
  )
}
