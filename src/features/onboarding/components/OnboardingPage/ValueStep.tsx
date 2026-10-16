'use client'

import { ChartLine, RefreshCw, ShieldCheck, type LucideIcon } from 'lucide-react'
import { StepHeading } from './ChoiceStep'

const POINTS: readonly { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ChartLine,
    title: 'Dựa trên dữ liệu của chính bạn',
    text: 'Mục tiêu kcal xuất phát từ ước tính, rồi được chỉnh theo cân nặng xu hướng và lượng bạn thật sự ăn.',
  },
  {
    icon: RefreshCw,
    title: 'Tự điều chỉnh mỗi tuần',
    text: 'Check-in hằng tuần cập nhật mục tiêu khi trao đổi chất của bạn thay đổi, không cần tự tính lại.',
  },
  {
    icon: ShieldCheck,
    title: 'Riêng tư và không quảng cáo',
    text: 'Dữ liệu sức khoẻ chỉ dùng để cá nhân hoá chương trình cho bạn.',
  },
]

/** Màn thay cho trang đánh giá người dùng: ba lợi ích có thật của MacroOS (không dùng lời đánh giá giả). */
export function ValueStep() {
  return (
    <div>
      <StepHeading title="Chương trình này thích ứng theo bạn và dựa trên khoa học mới nhất" />
      <ul className="space-y-3">
        {POINTS.map((point, index) => (
          <li
            key={point.title}
            className="border-border motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 flex gap-4 rounded-2xl border-2 p-4 [animation-fill-mode:backwards]"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <point.icon aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
            <div>
              <h2 className="text-base font-semibold">{point.title}</h2>
              <p className="text-muted-foreground text-base leading-snug">{point.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
