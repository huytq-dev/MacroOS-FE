const ORBITS = [
  { angle: 0, seconds: 3.2, delay: 0 },
  { angle: 60, seconds: 4.4, delay: -1.2 },
  { angle: 120, seconds: 5.6, delay: -2.4 },
] as const

/**
 * Animation quỹ đạo của "Reviewing metabolic history…": ba quỹ đạo elip lồng nhau xoay lệch 60°, mỗi quỹ đạo một chấm chạy với tốc độ
 * khác nhau quanh một nhân đang phập phồng. Chỉ SVG + CSS (không thư viện): chấm quay đều trong vòng tròn rồi bị ép dọc thành elip.
 * `motion-reduce` thì đứng yên (chấm nằm sẵn trên quỹ đạo).
 */
export function OrbitAnimation() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Reviewing" className="size-56">
      {ORBITS.map((orbit) => (
        <g key={orbit.angle} transform={`rotate(${orbit.angle} 100 100)`}>
          <g transform="translate(100 100) scale(1 0.38)">
            <circle r="86" fill="none" strokeWidth="2.5" className="stroke-foreground/20" />
            <g
              className="motion-safe:animate-spin"
              style={{
                animationDuration: `${orbit.seconds}s`,
                animationDelay: `${orbit.delay}s`,
                animationTimingFunction: 'linear',
                transformOrigin: '0 0',
              }}
            >
              <circle cx="86" r="8" className="fill-foreground" />
            </g>
          </g>
        </g>
      ))}
      <circle
        cx="100"
        cy="100"
        r="14"
        className="fill-[var(--mf-green)] motion-safe:animate-pulse"
      />
    </svg>
  )
}
