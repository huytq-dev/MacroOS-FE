'use client'

import { useRef, useState } from 'react'
import {
  ChartLine,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Scale,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CarouselSlide {
  readonly icon: LucideIcon
  readonly title: string
  readonly points: readonly string[]
}

const SLIDES: readonly CarouselSlide[] = [
  {
    icon: Zap,
    title: 'Log food faster',
    points: [
      'Add foods with a single tap of the + button',
      'Favorites are saved with the right serving',
      'Recent foods always sit at the top of the list',
    ],
  },
  {
    icon: ChartLine,
    title: 'Master your metabolism',
    points: [
      'Your kcal target adjusts itself every week',
      'Weekly check-ins, like a coach',
      'Expenditure fine-tuned with your real data',
    ],
  },
  {
    icon: ListChecks,
    title: 'Track macros by week',
    points: [
      'See protein, fat and carbs for each day',
      'Tap a day for details, or view the whole week',
      'Consumed or remaining, switch with one tap',
    ],
  },
  {
    icon: Scale,
    title: 'Stop worrying about weight swings',
    points: [
      'Weight Trend filters out daily fluctuations',
      'Scale weight and trend charts side by side',
      'Know exactly whether you are on track',
    ],
  },
]

const arrow =
  'bg-secondary focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full transition-opacity focus-visible:ring-1 focus-visible:outline-none disabled:opacity-30'

/** Các trang giới thiệu (mặc định là bốn trang tính năng của onboarding; truyền `slides` để dùng lại cho màn khác): vuốt ngang (scroll-snap) hoặc bấm mũi tên, có chấm báo vị trí. */
export function FeatureCarouselStep({
  slides = SLIDES,
}: {
  readonly slides?: readonly CarouselSlide[]
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)

  const goTo = (next: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.min(slides.length - 1, Math.max(0, next))
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={(event) => {
            const track = event.currentTarget
            setPage(Math.round(track.scrollLeft / track.clientWidth))
          }}
          className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
          aria-label="Feature overview"
          role="region"
        >
          {slides.map((slide, index) => (
            <section
              key={slide.title}
              aria-hidden={index !== page}
              className="flex w-full shrink-0 snap-center flex-col items-center gap-8 px-2 text-center"
            >
              <span className="bg-secondary flex size-28 items-center justify-center rounded-full">
                <slide.icon aria-hidden="true" className="size-12" />
              </span>
              <h1 className="text-3xl leading-tight font-extrabold tracking-wide text-balance uppercase">
                {slide.title}
              </h1>
              <ul className="text-muted-foreground space-y-3 text-lg leading-snug text-balance">
                {slide.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => goTo(page - 1)}
          className={arrow}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <div className="flex gap-2" aria-hidden="true">
          {slides.map((slide, index) => (
            <span
              key={slide.title}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === page ? 'bg-foreground w-6' : 'bg-muted-foreground/40 w-2'
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Trang sau"
          disabled={page === slides.length - 1}
          onClick={() => goTo(page + 1)}
          className={arrow}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
