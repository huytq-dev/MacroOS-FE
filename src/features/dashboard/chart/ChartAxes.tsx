import { PAD, WIDTH, axisLabels } from './geometry'

interface ChartAxesProps {
  readonly ticks: readonly number[]
  /** Giá trị đáy trục: vạch đáy vẽ liền, các vạch còn lại đứt. */
  readonly min: number
  readonly y: (value: number) => number
  readonly height: number
  readonly today: string
  readonly slots: number
  readonly pos: number
  /** Hiện số nguyên (kcal) hay giữ một số lẻ (kg). */
  readonly integerTicks?: boolean
}

const tickText = (value: number, integer: boolean) =>
  integer ? String(Math.round(value)) : String(Number(value.toFixed(1)))

/** Lưới ngang đứt + nhãn trục dọc bên phải + nhãn trục x theo ngày (trượt theo khi kéo / giãn khi đổi kỳ); dùng chung các biểu đồ chi tiết. */
export function ChartAxes({
  ticks,
  min,
  y,
  height,
  today,
  slots,
  pos,
  integerTicks = false,
}: ChartAxesProps) {
  return (
    <>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1="0"
            x2={WIDTH - PAD.right + 8}
            y1={y(tick)}
            y2={y(tick)}
            className={tick === min ? 'stroke-foreground/50' : 'stroke-foreground/25'}
            strokeWidth="1"
            strokeDasharray={tick === min ? undefined : '3 3'}
          />
          <text
            x={WIDTH - 2}
            y={y(tick) + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[11px] tabular-nums"
          >
            {tickText(tick, integerTicks)}
          </text>
        </g>
      ))}
      <g clipPath="url(#plot-clip-x)">
        {axisLabels(today, slots, pos).map((label) => (
          <text
            key={label.key}
            x={label.x}
            y={height - 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {label.text}
          </text>
        ))}
      </g>
    </>
  )
}

/** Vùng cắt theo chiều ngang của vùng vẽ (cột / đường tràn ra ngoài khi kéo bị cắt tại mép, không đè lên nhãn trục). */
export function PlotClip({ height }: { readonly height: number }) {
  return (
    <defs>
      <clipPath id="plot-clip">
        <rect x={PAD.left} y="0" width={WIDTH - PAD.left - PAD.right} height={height} />
      </clipPath>
      <clipPath id="plot-clip-x">
        <rect x={PAD.left - 8} y="0" width={WIDTH - PAD.left - PAD.right + 16} height={height} />
      </clipPath>
    </defs>
  )
}
