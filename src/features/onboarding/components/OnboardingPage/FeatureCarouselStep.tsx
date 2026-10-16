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

const SLIDES: readonly { icon: LucideIcon; title: string; points: readonly string[] }[] = [
  {
    icon: Zap,
    title: 'Ghi món nhanh hơn',
    points: [
      'Thêm món chỉ với một chạm bằng nút +',
      'Món yêu thích lưu sẵn đúng khẩu phần',
      'Món vừa ăn luôn nằm đầu danh sách',
    ],
  },
  {
    icon: ChartLine,
    title: 'Làm chủ trao đổi chất',
    points: [
      'Mục tiêu kcal tự điều chỉnh mỗi tuần',
      'Check-in hằng tuần như một huấn luyện viên',
      'Mức tiêu hao được tinh chỉnh theo dữ liệu thật',
    ],
  },
  {
    icon: ListChecks,
    title: 'Theo dõi macro theo tuần',
    points: [
      'Xem protein, chất béo, carb từng ngày',
      'Chạm một ngày để xem chi tiết, hoặc cả tuần',
      'Đã ăn hay còn lại, chuyển bằng một cú chạm',
    ],
  },
  {
    icon: Scale,
    title: 'Hết lo cân nặng lên xuống',
    points: [
      'Cân nặng xu hướng lọc bỏ biến động hằng ngày',
      'Biểu đồ cân thô và xu hướng cạnh nhau',
      'Biết chính xác bạn đang đi đúng hướng chưa',
    ],
  },
]

/** Bốn trang giới thiệu tính năng: vuốt ngang (scroll-snap) hoặc bấm mũi tên, có chấm báo vị trí. */
export function FeatureCarouselStep() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)

  const goTo = (next: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.min(SLIDES.length - 1, Math.max(0, next))
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
          aria-label="Giới thiệu tính năng"
          role="region"
        >
          {SLIDES.map((slide, index) => (
            <section
              key={slide.title}
              aria-hidden={index !== page}
              className="flex w-full shrink-0 snap-center flex-col items-center gap-8 px-12 text-center"
            >
              <span className="bg-secondary flex size-28 items-center justify-center rounded-full">
                <slide.icon aria-hidden="true" className="size-12" />
              </span>
              <h1 className="text-3xl leading-tight font-extrabold tracking-wide uppercase">
                {slide.title}
              </h1>
              <ul className="text-muted-foreground space-y-3 text-lg leading-snug">
                {slide.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {(['Trang trước', 'Trang sau'] as const).map((label, side) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            disabled={side === 0 ? page === 0 : page === SLIDES.length - 1}
            onClick={() => goTo(page + (side === 0 ? -1 : 1))}
            className={cn(
              'bg-secondary/80 focus-visible:ring-ring/50 absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition-opacity focus-visible:ring-1 focus-visible:outline-none disabled:opacity-30',
              side === 0 ? 'left-0' : 'right-0'
            )}
          >
            {side === 0 ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-center gap-2" aria-hidden="true">
        {SLIDES.map((slide, index) => (
          <span
            key={slide.title}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              index === page ? 'bg-foreground w-6' : 'bg-muted-foreground/40 w-2'
            )}
          />
        ))}
      </div>
    </div>
  )
}
