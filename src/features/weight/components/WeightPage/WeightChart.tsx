import type { WeightEntry } from '../../types/weight.types'

interface WeightChartProps {
  readonly items: WeightEntry[]
}

const WIDTH = 640
const HEIGHT = 200
const PAD = { top: 10, right: 10, bottom: 20, left: 36 }

/** Chấm nhạt = cân thô, đường tím đậm = trend (như MacroFactor). SVG thuần, không chart lib. */
export function WeightChart({ items }: WeightChartProps) {
  if (items.length < 2)
    return <p className="text-muted-foreground px-3 py-6 text-center text-xs">Cần ít nhất 2 lần cân để vẽ biểu đồ.</p>

  const points = [...items].sort((a, b) => a.logDate.localeCompare(b.logDate))
  const values = points.flatMap((p) => [p.weightKg, p.trendWeightKg ?? p.weightKg])
  const min = Math.floor(Math.min(...values) - 0.5)
  const max = Math.ceil(Math.max(...values) + 0.5)
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000
  const d0 = day(points[0].logDate)
  const d1 = day(points[points.length - 1].logDate)
  const x = (iso: string) => PAD.left + ((day(iso) - d0) / Math.max(1, d1 - d0)) * (WIDTH - PAD.left - PAD.right)
  const y = (kg: number) => PAD.top + ((max - kg) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom)

  const trend = points.filter((p) => p.trendWeightKg !== null).map((p) => `${x(p.logDate)},${y(p.trendWeightKg ?? 0)}`)
  const ticks = Array.from({ length: 4 }, (_, i) => min + ((max - min) * i) / 3)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Biểu đồ cân nặng và trend">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeWidth={1} />
          <text x={PAD.left - 4} y={y(tick) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {tick.toFixed(1)}
          </text>
        </g>
      ))}
      <polyline points={trend.join(' ')} fill="none" className="stroke-mf-trend" strokeWidth={2} />
      {points.map((p) => (
        <circle key={p.id} cx={x(p.logDate)} cy={y(p.weightKg)} r={2.5} className="fill-muted-foreground/60">
          <title>{`${p.logDate}: ${p.weightKg} kg${p.trendWeightKg !== null ? ` (trend ${p.trendWeightKg})` : ''}`}</title>
        </circle>
      ))}
      <text x={PAD.left} y={HEIGHT - 4} className="fill-muted-foreground text-[10px]">
        {points[0].logDate}
      </text>
      <text x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
        {points[points.length - 1].logDate}
      </text>
    </svg>
  )
}
