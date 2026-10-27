import Link from 'next/link'
import { DETAIL_CARD } from '../DetailPage'
import { routePath } from '@/config/route-path'

const TERMS: readonly (readonly [string, string])[] = [
  [
    'Initial estimate',
    'The starting number, worked out from your profile, held steady while MacroOS calibrates. It is not learned from your data yet.',
  ],
  [
    'Learned (Updating)',
    'Updated from your weight trend and your nutrition logs. Circle markers on the chart.',
  ],
  [
    'Holding',
    'Keeps the last learned number when there is not enough recent weight or nutrition data. Square markers.',
  ],
  [
    'Static',
    'A number you set yourself in Expenditure settings. It is not learned and has no Flux Range.',
  ],
]

/**
 * "About Expenditure" (như phần giải thích của MacroFactor): Expenditure là gì, dùng cân nặng + lượng ăn thế nào, phân biệt Initial / Learned / Holding / Static, và (chỉ khi khung đang có dải)
 * MacroOS Flux không phải khoảng tin cậy và không phải công thức của MacroFactor. Không nêu ngưỡng số ngày: ngưỡng do BE quyết và hiện ở thẻ lý do Holding.
 */
export function AboutExpenditure({ showFlux }: { readonly showFlux: boolean }) {
  return (
    <section aria-labelledby="about-expenditure-heading" className={`${DETAIL_CARD} space-y-4 p-4`}>
      <h2 id="about-expenditure-heading" className="text-lg font-bold">
        About Expenditure
      </h2>
      <p className="text-muted-foreground text-base leading-snug">
        Expenditure is your estimated daily energy use. MacroOS works it out from two things you
        log: your weight trend and what you eat. If you eat more than you burn your weight goes up,
        and the estimate follows what your weight actually does.
      </p>
      <dl className="space-y-3">
        {TERMS.map(([term, text]) => (
          <div key={term}>
            <dt className="text-base font-medium">{term}</dt>
            <dd className="text-muted-foreground text-sm leading-snug">{text}</dd>
          </div>
        ))}
      </dl>
      {showFlux && (
        <p data-about-flux="" className="text-muted-foreground text-sm leading-snug">
          <span className="text-foreground font-medium">MacroOS Flux Range</span> is a MacroOS
          approximation of how far your expenditure could be moving. It is not a statistical
          confidence interval and it is not MacroFactor&apos;s formula.
        </p>
      )}
      <Link
        href={routePath.moreExpenditure}
        className="text-foreground focus-visible:ring-ring/50 inline-flex h-11 items-center text-base underline underline-offset-4 focus-visible:ring-1 focus-visible:outline-none"
      >
        Expenditure settings
      </Link>
    </section>
  )
}
