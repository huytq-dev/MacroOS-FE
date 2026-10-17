import type { FocusKey } from '../../dashboard-layout'

const ROW_COLORS = [
  'var(--mf-tile-calories)',
  'var(--mf-tile-protein)',
  'var(--mf-tile-fat)',
  'var(--mf-tile-carbs)',
]
const BAR_HEIGHTS = [
  36, 30, 44, 32, 40, 28, 46, 34, 42, 30, 38, 33, 45, 29, 40, 36, 44, 30, 36, 32, 42, 34, 44, 31,
]
const PILL = 'fill-foreground/10'
const CELL = 'fill-foreground/10'

/** Hình minh hoạ của từng trang tiêu điểm (khung 160×100, không dùng dữ liệu thật): ô xám là chỗ của chữ số. */
export function FocusPreview({ kind }: { readonly kind: FocusKey }) {
  return (
    <svg viewBox="0 0 160 100" aria-hidden="true" className="h-auto w-full">
      {kind === 'weekly' && (
        <>
          {ROW_COLORS.map((color, row) =>
            Array.from({ length: 7 }, (_, col) => {
              const x = 6 + col * 15
              const y = 4 + row * 23
              return (
                <g key={`${row}-${col}`}>
                  <rect x={x} y={y} width="11" height="21" rx="2" className={CELL} />
                  <rect x={x + 4} y={y + 5} width="3" height="11" rx="1.5" fill={color} />
                </g>
              )
            })
          )}
          {[0, 1, 2, 3].map((row) => (
            <rect
              key={row}
              x="116"
              y={8 + row * 23}
              width="38"
              height="14"
              rx="3"
              className={PILL}
            />
          ))}
        </>
      )}
      {kind === 'energy' && (
        <>
          {BAR_HEIGHTS.map((height, index) => (
            <rect
              key={index}
              x={5 + index * 6.4}
              y={70 - height}
              width="4"
              height={height}
              fill="var(--mf-tile-calories)"
            />
          ))}
          <line x1="3" x2="157" y1="46" y2="46" stroke="var(--mf-tile-protein)" strokeWidth="2.4" />
          {[14, 62, 110].map((x) => (
            <rect key={x} x={x} y="78" width="36" height="16" rx="3" className={PILL} />
          ))}
        </>
      )}
      {kind === 'daily' && (
        <>
          <path
            d="M 55.2 80.6 A 34 34 0 1 1 104.8 80.6"
            fill="none"
            stroke="var(--mf-tile-calories)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <rect x="4" y="38" width="38" height="16" rx="3" className={PILL} />
          <rect x="62" y="46" width="36" height="16" rx="3" className={PILL} />
          <rect x="118" y="38" width="38" height="16" rx="3" className={PILL} />
          {['var(--mf-tile-protein)', 'var(--mf-tile-fat)', 'var(--mf-tile-carbs)'].map(
            (color, index) => (
              <rect
                key={color}
                x={6 + index * 52}
                y="88"
                width="46"
                height="3"
                rx="1.5"
                fill={color}
              />
            )
          )}
        </>
      )}
    </svg>
  )
}
