'use client'

import Link from 'next/link'
import { SheetFrame } from '@/components/shared/SheetFrame'
import { Switch } from '@/components/ui/switch'
import { routePath } from '@/config/route-path'
import {
  ClearDayIcon,
  CopyDayIcon,
  HideDetailsIcon,
  HideEmptyHoursIcon,
  OverviewIcon,
  SelectAllIcon,
} from './MoreIcons'

const ROW =
  'focus-visible:ring-ring/50 flex min-h-14 w-full items-center gap-4 px-4 text-left text-base focus-visible:ring-1 focus-visible:outline-none active:bg-muted transition-colors disabled:opacity-40'
const ICON = 'size-5 shrink-0'
const SWITCH =
  'h-7! w-12! data-[state=checked]:bg-white! data-[state=unchecked]:bg-zinc-600! [&>span]:size-6! [&>span]:bg-black! [&>span]:data-[state=checked]:translate-x-[20px]!'

interface MoreSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly hasEntries: boolean
  readonly hideFoodDetails: boolean
  readonly hideEmptyHours: boolean
  readonly onHideFoodDetailsChange: (hide: boolean) => void
  readonly onHideEmptyHoursChange: (hide: boolean) => void
  readonly onCopyDay: () => void
  readonly onSelectAll: () => void
  readonly onClearDay: () => void
}

/**
 * Bảng "More" của Food Log (nút ba chấm): Nutrition Overview (trang mới), Copy Day, Select All, Clear Day và hai công tắc hiển thị
 * (Hide Food Details, Hide Empty Hours, nhớ trên thiết bị). Chọn một
 * hành động thì bảng trượt xuống rồi mới mở hộp thoại tiếp theo.
 */
export function MoreSheet({
  open,
  onOpenChange,
  hasEntries,
  hideFoodDetails,
  hideEmptyHours,
  onHideFoodDetailsChange,
  onHideEmptyHoursChange,
  onCopyDay,
  onSelectAll,
  onClearDay,
}: MoreSheetProps) {
  const act = (action: () => void) => () => {
    onOpenChange(false)
    action()
  }
  return (
    <SheetFrame open={open} onOpenChange={onOpenChange} title="More" showDone={false}>
      <ul className="divide-border divide-y pb-2">
        <li>
          <Link href={routePath.foodLogNutritionOverview} className={ROW}>
            <OverviewIcon className={ICON} /> Nutrition Overview
          </Link>
        </li>
        <li>
          <button type="button" disabled={!hasEntries} onClick={act(onCopyDay)} className={ROW}>
            <CopyDayIcon className={ICON} /> Copy Day
          </button>
        </li>
        <li>
          <button type="button" disabled={!hasEntries} onClick={act(onSelectAll)} className={ROW}>
            <SelectAllIcon className={ICON} /> Select All
          </button>
        </li>
        <li>
          <button type="button" disabled={!hasEntries} onClick={act(onClearDay)} className={ROW}>
            <ClearDayIcon className={ICON} /> Clear Day
          </button>
        </li>
        <li className="flex min-h-14 items-center gap-4 px-4 text-base">
          <HideDetailsIcon className={ICON} />
          <span className="flex-1">Hide Food Details</span>
          <Switch
            checked={hideFoodDetails}
            onCheckedChange={onHideFoodDetailsChange}
            aria-label="Hide food details"
            className={SWITCH}
          />
        </li>
        <li className="flex min-h-14 items-center gap-4 px-4 text-base">
          <HideEmptyHoursIcon className={ICON} />
          <span className="flex-1">Hide Empty Hours</span>
          <Switch
            checked={hideEmptyHours}
            onCheckedChange={onHideEmptyHoursChange}
            aria-label="Hide empty hours"
            className={SWITCH}
          />
        </li>
      </ul>
    </SheetFrame>
  )
}
