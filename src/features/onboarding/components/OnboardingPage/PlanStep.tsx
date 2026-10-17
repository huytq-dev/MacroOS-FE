'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PlanId = 'monthly' | 'half' | 'yearly'

const PLANS: readonly { id: PlanId; title: string; detail: string }[] = [
  { id: 'monthly', title: '1 month', detail: 'Renews monthly' },
  { id: 'yearly', title: '12 months', detail: 'Best value once paid plans start' },
  { id: 'half', title: '6 months', detail: 'A balance between the two plans' },
]

interface PlanStepProps {
  readonly plan: PlanId
  readonly onChange: (plan: PlanId) => void
}

/**
 * Màn "Chọn gói". MacroOS chưa có thanh toán nên mọi gói đều miễn phí trong bản thử nghiệm và lựa chọn
 * chưa ràng buộc gì (không lưu, không tính tiền); giữ màn này để đúng luồng, khi có billing sẽ nối vào.
 */
export function PlanStep({ plan, onChange }: PlanStepProps) {
  return (
    <div className="space-y-6">
      <h1 className="pt-4 text-center text-3xl font-extrabold tracking-wide uppercase">
        Choose a plan
      </h1>
      <div role="radiogroup" aria-label="Plans" className="space-y-3">
        {PLANS.map((item, index) => {
          const selected = item.id === plan
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(item.id)}
              className={cn(
                'focus-visible:ring-ring/50 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:animation-duration-300 relative flex min-h-20 w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors duration-200 [animation-fill-mode:backwards] focus-visible:ring-1 focus-visible:outline-none',
                selected ? 'border-foreground bg-foreground/5' : 'border-border'
              )}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span>
                <span className="block text-lg font-semibold">{item.title}</span>
                <span className="text-muted-foreground block text-sm">{item.detail}</span>
              </span>
              <span className="text-right">
                <span className="block text-base font-semibold tabular-nums">$0</span>
                <span className="text-muted-foreground block text-sm">free (trial)</span>
              </span>
              {selected && (
                <span
                  aria-hidden="true"
                  className="bg-foreground text-background motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:animation-duration-200 absolute -right-1 -bottom-3 flex size-7 items-center justify-center rounded-full"
                >
                  <Check className="size-4" />
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-muted-foreground text-center text-sm">
        The trial is free of charge. You can change your plan once MacroOS opens up payments.
      </p>
    </div>
  )
}
