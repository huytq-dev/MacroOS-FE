'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface DashboardCarouselProps {
  /** Mỗi phần tử là một trang; `label` đọc cho trình đọc màn hình và đặt tên cho chấm. */
  readonly slides: readonly {
    readonly key: string
    readonly label: string
    readonly node: React.ReactNode
  }[]
}

/** Carousel ngang vuốt có scroll-snap, các chấm bên dưới báo vị trí (bấm chấm để nhảy tới trang). */
export function DashboardCarousel({ slides }: DashboardCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)

  const goTo = (index: number) => {
    const track = trackRef.current
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
  }

  // contain:inline-size để bề rộng của carousel không đẩy rộng cả trang (ba trang xếp ngang bên trong)
  return (
    <div className="min-w-0 [contain:inline-size]">
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Nutrition overview"
        onScroll={(event) => {
          const track = event.currentTarget
          setPage(Math.round(track.scrollLeft / track.clientWidth))
        }}
        className="bg-card flex snap-x snap-mandatory [scrollbar-width:none] items-stretch overflow-x-auto overscroll-x-contain rounded-2xl [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <section
            key={slide.key}
            aria-label={`${slide.label} (${index + 1}/${slides.length})`}
            className="flex w-full shrink-0 snap-center flex-col px-4 pt-3.5 pb-3"
          >
            {slide.node}
          </section>
        ))}
      </div>
      <div className="mt-4 flex justify-center" role="tablist" aria-label="Choose page">
        {slides.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            role="tab"
            aria-selected={index === page}
            aria-label={slide.label}
            onClick={() => goTo(index)}
            // Chấm cách nhau 28px như MacroFactor; vùng bấm 32px (UI.md: tối thiểu 32px) nhờ before, không đổi khoảng cách
            className="focus-visible:ring-ring/50 relative flex h-11 w-7 items-center justify-center rounded-full before:absolute before:-inset-x-0.5 before:inset-y-0 before:content-[''] focus-visible:ring-1 focus-visible:outline-none"
          >
            <span
              className={cn(
                'size-2 rounded-full transition-colors duration-200',
                index === page ? 'bg-foreground' : 'bg-muted-foreground/40'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
