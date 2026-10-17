import type { ThumbKind } from '../../dashboard-layout'

const ORANGE = 'var(--mf-tile-protein)'
const PURPLE = 'var(--mf-purple)'
const GREEN = 'var(--mf-tile-carbs)'
const BLUE = 'var(--mf-tile-calories)'
const YELLOW = 'var(--mf-tile-fat)'
const PINK = '#fb7185'

const curve = (color: string) => (
  <path
    d="M3 15 C8 15 8 8 12 10 S17 17 21 7"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
  />
)

const dots = (color: string) =>
  [6, 12, 18].map((cx) => <circle key={cx} cx={cx} cy="12" r="2" fill={color} />)

/** Hình nhỏ đầu dòng ô trong màn tuỳ chỉnh: gợi ý loại biểu đồ của ô (màu `color` dùng cho thanh dinh dưỡng). */
export function TileThumb({
  kind,
  color = GREEN,
}: {
  readonly kind: ThumbKind
  readonly color?: string
}) {
  const content: Record<ThumbKind, React.ReactNode> = {
    trendOrange: curve(ORANGE),
    trendPurple: curve(PURPLE),
    trendGreen: curve(GREEN),
    bars: (
      <>
        <rect x="4" y="12" width="4" height="8" fill={BLUE} />
        <rect x="10" y="6" width="4" height="14" fill={BLUE} />
        <rect x="16" y="15" width="4" height="5" fill={BLUE} />
      </>
    ),
    goal: (
      <>
        <rect x="2" y="10" width="14" height="4" fill={GREEN} />
        <rect x="17" y="10" width="5" height="4" fill={PURPLE} />
      </>
    ),
    dotsGreen: dots(GREEN),
    dotsBlue: dots(BLUE),
    photos: (
      <>
        <rect x="3" y="5" width="13" height="11" rx="1.5" fill={GREEN} />
        <rect x="14" y="13" width="7" height="7" rx="1.5" fill={GREEN} />
      </>
    ),
    ruler: (
      <>
        <rect x="3" y="6" width="14" height="6" rx="1.5" fill={GREEN} />
        <rect x="15" y="14" width="6" height="5" rx="1.5" fill={GREEN} />
      </>
    ),
    barsOrange: (
      <>
        <rect x="4" y="11" width="4" height="9" fill={ORANGE} />
        <rect x="10" y="6" width="4" height="14" fill={ORANGE} />
        <rect x="16" y="15" width="4" height="5" fill={ORANGE} />
      </>
    ),
    dotsPink: dots(PINK),
    bar: <rect x="3" y="10" width="18" height="4" rx="0.5" fill={color} />,
    macros: (
      <>
        <rect x="4" y="12" width="3.5" height="8" fill={BLUE} />
        <rect x="9" y="7" width="3.5" height="13" fill={ORANGE} />
        <rect x="14" y="10" width="3.5" height="10" fill={YELLOW} />
        <rect x="19" y="14" width="2.5" height="6" fill={GREEN} />
      </>
    ),
  }
  return (
    <span className="bg-foreground/8 flex size-8 shrink-0 items-center justify-center rounded-sm">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
        {content[kind]}
      </svg>
    </span>
  )
}
