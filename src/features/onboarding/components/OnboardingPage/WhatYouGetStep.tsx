'use client'

import { Castle, ChartArea, ChartLine, Lock, Zap, type LucideIcon } from 'lucide-react'
import { Bubbles } from './LineIcons'
import { cn } from '@/lib/utils'
import type { OptionIcon } from '../../types/onboarding-options.types'

const BENEFITS: readonly {
  icon: LucideIcon | OptionIcon
  solid?: boolean
  title: string
  text: string
}[] = [
  {
    icon: Castle,
    solid: true,
    title: 'A nutrition plan built for your goal',
    text: 'Reach your goal faster with a science-based plan calculated just for you.',
  },
  {
    icon: Zap,
    solid: true,
    title: 'Log food in seconds',
    text: 'Search foods, add them with one tap, and reuse recent foods and favorites.',
  },
  {
    icon: ChartArea,
    solid: true,
    title: 'Coaching that follows your metabolism',
    text: 'Your nutrition plan adjusts itself to your ever-changing expenditure.',
  },
  {
    icon: Bubbles,
    title: 'Track nutrition by week',
    text: 'See daily kcal and macros against your target, consumed or remaining.',
  },
  {
    icon: ChartLine,
    title: 'Understand your Weight Trend',
    text: 'Find your true weight with an algorithm that smooths your daily weigh-ins.',
  },
  {
    icon: Lock,
    solid: true,
    title: 'Private and ad-free',
    text: 'We do not sell your data or use ad networks to track you.',
  },
]

/** "Bạn nhận được gì": danh sách lợi ích có thật của MacroOS (icon, tiêu đề, mô tả), các dòng hiện lần lượt. */
export function WhatYouGetStep() {
  return (
    <div>
      <h1 className="pb-6 text-center text-3xl font-extrabold tracking-wide uppercase">
        What you get
      </h1>
      <ul className="divide-border divide-y">
        {BENEFITS.map((benefit, index) => (
          <li
            key={benefit.title}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300 flex gap-4 py-4 [animation-fill-mode:backwards]"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <benefit.icon
              aria-hidden="true"
              className={cn('mt-1 size-6 shrink-0', benefit.solid && 'fill-current')}
            />
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
