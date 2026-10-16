'use client'

import { ChartLine, Heart, Lock, Salad, Target, Zap, type LucideIcon } from 'lucide-react'

const BENEFITS: readonly { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Target,
    title: 'Kế hoạch ăn dành riêng cho mục tiêu của bạn',
    text: 'Đạt mục tiêu nhanh hơn với kế hoạch khoa học, được tính riêng cho bạn.',
  },
  {
    icon: Zap,
    title: 'Ghi món ăn thật nhanh',
    text: 'Tìm món, thêm bằng một chạm, dùng món gần đây và món yêu thích.',
  },
  {
    icon: ChartLine,
    title: 'Huấn luyện theo trao đổi chất của bạn',
    text: 'Kế hoạch dinh dưỡng tự điều chỉnh theo mức tiêu hao luôn thay đổi của bạn.',
  },
  {
    icon: Salad,
    title: 'Theo dõi dinh dưỡng theo tuần',
    text: 'Xem kcal và macro từng ngày so với mục tiêu, đã ăn hay còn lại.',
  },
  {
    icon: Heart,
    title: 'Hiểu xu hướng cân nặng',
    text: 'Tìm cân nặng thật của bạn nhờ thuật toán làm mượt các lần cân hằng ngày.',
  },
  {
    icon: Lock,
    title: 'Riêng tư, không quảng cáo',
    text: 'Chúng tôi không bán dữ liệu và không dùng mạng quảng cáo để theo dõi bạn.',
  },
]

/** "Bạn nhận được gì": danh sách lợi ích có thật của MacroOS (icon, tiêu đề, mô tả), các dòng hiện lần lượt. */
export function WhatYouGetStep() {
  return (
    <div>
      <h1 className="pb-6 text-center text-3xl font-extrabold tracking-wide uppercase">
        Bạn nhận được gì
      </h1>
      <ul className="divide-border divide-y">
        {BENEFITS.map((benefit, index) => (
          <li
            key={benefit.title}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300 flex gap-4 py-4 [animation-fill-mode:backwards]"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <benefit.icon aria-hidden="true" className="mt-1 size-6 shrink-0" />
            <div>
              <h2 className="text-lg leading-snug font-medium">{benefit.title}</h2>
              <p className="text-muted-foreground text-base leading-snug">{benefit.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
