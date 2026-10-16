'use client'

import { ChartLine, Dumbbell, Salad, Target, type LucideIcon } from 'lucide-react'

const TIMELINE: readonly { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Salad,
    title: 'Ghi bữa ăn và cân nặng mỗi ngày',
    text: 'MacroOS dùng dữ liệu đó để phân tích trao đổi chất và cá nhân hoá kế hoạch của bạn.',
  },
  {
    icon: ChartLine,
    title: 'Sau ngày thứ 3, MacroOS cập nhật mức tiêu hao',
    text: 'Thuật toán bắt đầu tinh chỉnh mức tiêu hao ước tính trên trang Tổng quan.',
  },
  {
    icon: Target,
    title: 'Tuần sau, bạn nhận check-in đầu tiên',
    text: 'MacroOS điều chỉnh mục tiêu calo như một huấn luyện viên dinh dưỡng. Hãy tiếp tục ghi mỗi ngày.',
  },
  {
    icon: Dumbbell,
    title: 'Sau 30 ngày, kế hoạch khớp với trao đổi chất của bạn',
    text: 'Khi ghi đều đặn, MacroOS nắm được trao đổi chất và đưa mục tiêu calo khớp với cơ thể bạn.',
  },
]

/** "30 ngày đầu tiên": timeline dọc bốn mốc, các mốc hiện lần lượt và đường nối vẽ dần. */
export function First30DaysStep() {
  return (
    <div>
      <h1 className="pt-4 pb-8 text-center text-3xl font-extrabold tracking-wide uppercase">
        30 ngày đầu tiên
      </h1>
      <ol>
        {TIMELINE.map((item, index) => (
          <li
            key={item.title}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:animation-duration-400 relative flex gap-4 pb-8 [animation-fill-mode:backwards] last:pb-0"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            {index < TIMELINE.length - 1 && (
              <span
                aria-hidden="true"
                className="bg-foreground absolute top-12 bottom-0 left-5 w-0.5"
              />
            )}
            <span
              aria-hidden="true"
              className="bg-foreground text-background flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <item.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg leading-snug font-medium">{item.title}</h2>
              <p className="text-muted-foreground text-base leading-snug">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
