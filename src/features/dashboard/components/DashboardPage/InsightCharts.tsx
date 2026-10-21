'use client'

import { useCallback, useState } from 'react'
import { smoothPath } from '../WeightTrendPage/WeightTrendChart'
import type { BalancePoint } from '../../energy-balance.utils'
import type { ExpDay } from '../../expenditure-series'
import type { TrendDay } from '../../weight-trend-series'
import { cn } from '@/lib/utils'

/** Số ngày trên trục ngang của các biểu đồ nhỏ ("Last 7 Days"). */
export const INSIGHT_DAYS = 7

/** Lề ngang / dọc (px) trong vùng vẽ để marker và cột không bị cắt mép. */
const PAD_X = 7
const PAD_Y = 8
/** Dải Flux chiếm tối đa chừng này chiều cao vùng vẽ (MF để dải thấp, không kín cả ô). */
const FLUX_FILL = 0.45
/** Thang tối thiểu (kcal): dải Flux hẹp / phẳng không được kéo giãn thành khối cao; ô nhỏ chỉ để nhìn xu hướng. */
const MIN_FLUX_SPAN_KCAL = 200
/** Thang tối thiểu (kg) của đường cân: dao động vài trăm gram không được phóng thành đường dốc, nhưng cũng không bị dẹt về 0. */
const MIN_WEIGHT_SPAN_KG = 1
/** Cột Energy Balance chiếm chừng này một ô ngày; cột thấp nhất vẫn cao ít nhất MIN_BAR_PX để thấy được. */
const BAR_SHARE = 0.7
const MIN_BAR_PX = 2

interface Size {
  readonly width: number
  readonly height: number
}

/**
 * Vùng vẽ của một ô Insights: cao cố định, rộng hết ô, đo kích thước thật (ResizeObserver) để vẽ theo px đúng tỉ lệ thay vì một
 * viewBox cố định bị co vào góc; chưa đo xong thì chưa vẽ gì.
 */
export function ChartArea({
  children,
  className,
}: {
  readonly children: (size: Size) => React.ReactNode
  readonly className?: string
}) {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const update = () => setSize({ width: node.clientWidth, height: node.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} aria-hidden="true" className={cn('h-14 w-full', className)}>
      {size.width > 0 && (
        <svg width={size.width} height={size.height} className="overflow-visible">
          {children(size)}
        </svg>
      )}
    </div>
  )
}

/** x của ngày thứ `index` (0 = 6 ngày trước, 6 = hôm nay) trải đều hết bề rộng, dùng cho đường / marker. */
const lineX = (index: number, width: number) =>
  PAD_X + (index * (width - 2 * PAD_X)) / (INSIGHT_DAYS - 1)

/** Các điểm có dữ liệu trong cửa sổ 7 ngày, kèm vị trí ngày trong cửa sổ (ngày trước khi có dữ liệu bị bỏ, như MacroFactor). */
function inWindow<T extends { readonly date: string }>(
  window: readonly string[],
  items: readonly T[]
) {
  const byDate = new Map(items.map((item) => [item.date, item]))
  return window.flatMap((date, index) => {
    const item = byDate.get(date)
    return item ? [{ item, index }] : []
  })
}

interface FluxMiniProps {
  readonly window: readonly string[]
  readonly days: readonly ExpDay[]
}

/**
 * Expenditure nhỏ (cùng nguồn với trang chi tiết): dải Flux cam mờ liền (mép trên / dưới cong mượt theo low / high từng ngày, hai đầu
 * thẳng đứng), đường Expenditure mảnh và marker mỗi ngày (ô vuông rỗng = Holding / Calibrating, vòng tròn = Updating), vẽ từ ngày đầu
 * có dữ liệu tới hôm nay trên trục 7 ngày; thang y quanh dải, đủ rộng để dải không thành khối cao.
 */
export function FluxMini({ window, days }: FluxMiniProps) {
  const shown = inWindow(window, days)
  if (shown.length === 0) return null
  return (
    <ChartArea>
      {({ width, height }) => {
        const lo = Math.min(...shown.map(({ item }) => item.low))
        const hi = Math.max(...shown.map(({ item }) => item.high))
        const span = Math.max((hi - lo) / FLUX_FILL, MIN_FLUX_SPAN_KCAL)
        const mid = (hi + lo) / 2
        const y = (value: number) => height / 2 - ((value - mid) / span) * (height - 2 * PAD_Y)
        // Đầu phải của dải thu về một điểm ở ngày cuối (đúng điểm đường kết thúc), như MacroFactor
        const lastIndex = shown.length - 1
        const edge = (pick: 'high' | 'low') =>
          shown.map(({ item, index }, position) => ({
            x: lineX(index, width),
            y: y(position === lastIndex && lastIndex > 0 ? item.kcal : item[pick]),
          }))
        const top = edge('high')
        const bottom = edge('low').reverse()
        const band =
          shown.length > 1
            ? `${smoothPath(top)} L ${bottom[0].x} ${bottom[0].y} ${smoothPath(bottom, false)} Z`
            : `M ${top[0].x - 6} ${top[0].y} H ${top[0].x + 6} V ${bottom[0].y} H ${top[0].x - 6} Z`
        const line = shown
          .map(({ item, index }) => `${lineX(index, width)},${y(item.kcal)}`)
          .join(' ')
        return (
          <g className="text-mf-tile-protein">
            <path
              d={band}
              className="fill-mf-flux-band/50 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500"
            />
            {shown.length > 1 && (
              <polyline
                points={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                pathLength={1}
                className="motion-safe:animate-chart-draw"
              />
            )}
            {shown.map(({ item, index }) => {
              const cx = lineX(index, width)
              const cy = y(item.kcal)
              const common = {
                fill: 'var(--card)',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                className: 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500',
              }
              return item.holding ? (
                <rect key={item.date} x={cx - 3.5} y={cy - 3.5} width="7" height="7" {...common} />
              ) : (
                <circle key={item.date} cx={cx} cy={cy} r="3.5" {...common} />
              )
            })}
          </g>
        )
      }}
    </ChartArea>
  )
}

interface TrendMiniProps {
  readonly window: readonly string[]
  readonly days: readonly TrendDay[]
}

/**
 * Weight Trend nhỏ (cùng nguồn với trang chi tiết): đường tím mảnh mượt + vòng tròn rỗng mỗi ngày có xu hướng, trục 7 ngày; thang y
 * vừa khít khoảng dữ liệu nhưng không hẹp hơn MIN_WEIGHT_SPAN_KG (dao động nhỏ không thành đường dốc, đường phẳng nằm giữa ô).
 */
export function TrendMini({ window, days }: TrendMiniProps) {
  const shown = inWindow(window, days)
  if (shown.length === 0) return null
  return (
    <ChartArea>
      {({ width, height }) => {
        const values = shown.map(({ item }) => item.trend)
        const lo = Math.min(...values)
        const hi = Math.max(...values)
        const span = Math.max(hi - lo, MIN_WEIGHT_SPAN_KG)
        const mid = (hi + lo) / 2
        const y = (value: number) => height / 2 - ((value - mid) / span) * (height - 2 * PAD_Y)
        const points = shown.map(({ item, index }) => ({
          x: lineX(index, width),
          y: y(item.trend),
        }))
        return (
          <g className="text-mf-purple">
            {points.length > 1 && (
              <path
                d={smoothPath(points)}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                pathLength={1}
                className="motion-safe:animate-chart-draw"
              />
            )}
            {points.map((point, index) => (
              <circle
                key={shown[index].item.date}
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill="var(--card)"
                stroke="currentColor"
                strokeWidth="1.5"
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500"
              />
            ))}
          </g>
        )
      }}
    </ChartArea>
  )
}

interface BalanceMiniProps {
  readonly window: readonly string[]
  readonly points: readonly BalancePoint[]
  /** Màu đường mốc (Expenditure cam, Targets vàng). */
  readonly lineClassName: string
}

/**
 * Energy Balance nhỏ (cùng nguồn với trang chi tiết): cột xanh kcal đã ăn mỗi ngày (ngày chưa log không có cột, ngày chưa đủ mờ hơn)
 * và đường mốc đứt cam trải hết bề rộng, CÙNG một thang 0 → mức cao nhất nên cột và mốc so đúng tỉ lệ; chưa có cột nào thì chỉ
 * có đường mốc ở giữa ô, chưa có mốc thì không vẽ gì.
 */
export function BalanceMini({ window, points, lineClassName }: BalanceMiniProps) {
  const byDate = new Map(points.map((point) => [point.date, point]))
  const days = window.map((date) => byDate.get(date) ?? null)
  // Ngày thiếu mốc dùng mốc gần nhất đã biết để đường luôn trải đủ 7 ngày
  const known = [...days].reverse().find((day) => day?.baseline != null)?.baseline ?? null
  const hasBars = days.some((day) => day?.consumed != null)
  if (known === null && !hasBars) return null
  return (
    <ChartArea>
      {({ width, height }) => {
        const slot = width / INSIGHT_DAYS
        const centerX = (index: number) => slot * (index + 0.5)
        const top = Math.max(
          1,
          ...days.flatMap((day) => [day?.consumed ?? 0, day?.baseline ?? known ?? 0])
        )
        const bottom = height - PAD_Y / 2
        const y = (value: number) => bottom - (value / top) * (bottom - PAD_Y / 2)
        const baselineY = (day: BalancePoint | null) =>
          hasBars ? y(day?.baseline ?? known ?? 0) : height / 2
        // Đường mốc trải từ mép trái tới mép phải vùng vẽ (qua tâm từng ngày)
        const baseline =
          known === null
            ? null
            : [
                `0,${baselineY(days[0])}`,
                ...days.map((day, index) => `${centerX(index)},${baselineY(day)}`),
                `${width},${baselineY(days[days.length - 1])}`,
              ].join(' ')
        return (
          <>
            {days.map((day, index) =>
              day?.consumed == null ? null : (
                <rect
                  key={window[index]}
                  x={centerX(index) - (slot * BAR_SHARE) / 2}
                  y={Math.min(y(day.consumed), bottom - MIN_BAR_PX)}
                  width={slot * BAR_SHARE}
                  height={Math.max(MIN_BAR_PX, bottom - y(day.consumed))}
                  className={cn(
                    'fill-mf-tile-calories motion-safe:animate-chart-rise',
                    day.incomplete && 'opacity-50'
                  )}
                />
              )
            )}
            {baseline && (
              <polyline
                points={baseline}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className={cn(
                  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-700',
                  lineClassName
                )}
              />
            )}
          </>
        )
      }}
    </ChartArea>
  )
}

/**
 * Goal Progress nhỏ: ô xám dày trải hết bề rộng, phần đã đạt là thanh xanh mảnh sát mép trái giữa ô (rộng đúng % đã đạt, tối thiểu vài
 * px khi > 0 để % nhỏ vẫn thấy); chưa có goal (null) thì chỉ có ô xám trống, không phải 0%.
 */
export function GoalMini({ percent }: { readonly percent: number | null }) {
  const clamped = percent === null ? 0 : Math.min(100, Math.max(0, percent))
  return (
    <div aria-hidden="true" className="flex h-14 w-full items-center">
      <div className="bg-foreground/10 relative h-5 w-full overflow-hidden rounded-md">
        {clamped > 0 && (
          <span
            className="bg-mf-tile-carbs motion-safe:animate-chart-grow absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full"
            style={{ width: `max(4px, ${clamped}%)` }}
          />
        )}
      </div>
    </div>
  )
}
