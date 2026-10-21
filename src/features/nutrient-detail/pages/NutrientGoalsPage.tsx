import { GoalAnatomy } from '../components/GoalAnatomy'
import { GOAL_COPY } from '../nutrient-copy'
import type { NutrientInfo } from '../nutrient-detail.utils'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { DETAIL_CARD } from '@/features/dashboard/components/DetailPage'

const SECTIONS = [
  { title: 'Introduction', text: GOAL_COPY.introduction },
  { title: 'Floor', text: GOAL_COPY.floor },
  { title: 'Target', text: GOAL_COPY.target },
  { title: 'Ceiling', text: GOAL_COPY.ceiling },
] as const

/**
 * "About Nutrient Goals" (nút ⓘ ở biểu đồ một chất): hình minh hoạ thanh mục tiêu theo màu của chất đang xem với Floor / Target / Ceiling,
 * rồi các phần Introduction / Floor / Target / Ceiling; các phần hiện lần lượt.
 */
export function NutrientGoalsPage({ info }: { readonly info: NutrientInfo }) {
  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-6 md:pb-0">
      <div className="bg-card sticky top-0 z-20 -mx-4 -mt-[calc(env(safe-area-inset-top)+1.25rem)] px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 md:static md:mx-0 md:mt-0 md:rounded-2xl md:pt-2">
        <SubPageHeader title="About Nutrient Goals" />
        <div className="mt-3 mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">Anatomy of a Nutrient Goal</h2>
          <span className="text-muted-foreground shrink-0 text-sm">Example</span>
        </div>
        <GoalAnatomy info={info} />
      </div>

      {SECTIONS.map((section, index) => (
        <section
          key={section.title}
          aria-labelledby={`goal-${section.title}`}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 space-y-3 [animation-fill-mode:backwards]"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <h2 id={`goal-${section.title}`} className="text-xl font-bold">
            {section.title}
          </h2>
          <p className={`${DETAIL_CARD} text-foreground p-4 text-lg leading-snug`}>
            {section.text}
          </p>
        </section>
      ))}
    </div>
  )
}
