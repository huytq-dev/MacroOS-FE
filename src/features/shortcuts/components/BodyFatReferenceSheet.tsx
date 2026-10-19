'use client'

import { SheetFrame } from '@/components/shared/SheetFrame'
import { BODY_FAT_BANDS } from '@/features/onboarding/types/onboarding-options.types'
import { cn } from '@/lib/utils'

interface BodyFatReferenceSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** Chọn một khoảng: trả về % mỡ giữa khoảng (làm tròn xuống, 50+ là 50). */
  readonly onSelect: (percent: number) => void
}

const MAX_PERCENT = 50

/**
 * Bảng "Reference" của Visual Body Fat: lưới 3×3 các khoảng % mỡ (dùng lại bảng `BODY_FAT_BANDS` của wizard thiết lập, kèm mô tả);
 * chọn một ô thì điền % giữa khoảng và đóng. Hình người chưa có asset nên dùng hình thân đơn giản đổi độ rộng theo mức (PLACEHOLDER).
 */
export function BodyFatReferenceSheet({
  open,
  onOpenChange,
  onSelect,
}: BodyFatReferenceSheetProps) {
  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="Reference" showDone={false} tall>
      <ul className="grid grid-cols-3 gap-2 p-3">
        {BODY_FAT_BANDS.map((band, index) => (
          <li key={band.value}>
            <button
              type="button"
              onClick={() => {
                onSelect(Math.min(Math.floor(band.midPercent), MAX_PERCENT))
                onOpenChange(false)
              }}
              className="bg-secondary focus-visible:ring-ring/50 flex w-full flex-col items-center gap-2 rounded-xl px-2 py-3 transition-transform duration-200 focus-visible:ring-1 focus-visible:outline-none active:scale-95 motion-reduce:active:scale-100"
            >
              <svg viewBox="0 0 60 80" aria-hidden="true" className="h-20 w-14">
                <circle cx="30" cy="12" r="8" className="fill-foreground/70" />
                <ellipse
                  cx="30"
                  cy="46"
                  rx={11 + index * 1.9}
                  ry="26"
                  className={cn('fill-foreground/70')}
                />
              </svg>
              <span className="text-base font-medium tabular-nums">{band.label}</span>
              <span className="text-muted-foreground line-clamp-2 text-center text-xs">
                {band.description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </SheetFrame>
  )
}
