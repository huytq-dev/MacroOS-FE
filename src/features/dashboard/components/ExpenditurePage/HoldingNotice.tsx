import Link from 'next/link'
import { PauseCircle } from 'lucide-react'
import type { HoldingAction, HoldingNotice as Notice } from '../../expenditure-series'
import { routePath } from '@/config/route-path'

const ACTIONS: Record<HoldingAction, { label: string; href: string }> = {
  'weigh-in': { label: 'Log weight', href: routePath.weight },
  food: { label: 'Log food', href: routePath.foodLog },
}

/**
 * Vì sao Expenditure đang Holding, ngay trên biểu đồ (không chôn trong Insights): mỗi lý do một dòng (từ mã của BE) và nút làm đúng việc còn thiếu
 * (Log weight / Log food, 44px). Chỉ hiện khi BE báo Holding kèm mã lý do FE biết (`holdingNoticeOf`).
 */
export function HoldingNotice({ notice }: { readonly notice: Notice }) {
  return (
    <section
      role="status"
      aria-label={
        notice.kind === 'Holding' ? 'Why Expenditure is on hold' : 'Why Expenditure is calibrating'
      }
      data-holding-notice=""
      className="bg-card flex flex-col gap-3 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <PauseCircle aria-hidden="true" className="text-mf-tile-fat-text mt-0.5 size-6 shrink-0" />
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold">
            {notice.kind === 'Holding' ? 'Expenditure is on hold' : 'Expenditure is calibrating'}
          </h2>
          {(notice.reasons.length > 0 ? notice.reasons : [notice.summary]).map((reason) => (
            <p key={reason} className="text-muted-foreground text-sm leading-snug">
              {reason}
            </p>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {notice.actions.map((action) => (
          <Link
            key={action}
            href={ACTIONS[action].href}
            className="bg-secondary text-secondary-foreground focus-visible:ring-ring/50 inline-flex h-11 items-center rounded-full px-5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none motion-safe:active:scale-[0.98]"
          >
            {ACTIONS[action].label}
          </Link>
        ))}
      </div>
    </section>
  )
}
