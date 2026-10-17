import { ArrowUp, X } from 'lucide-react'
import type { FoodLogSettings } from '../../food-log-settings'
import type { MacroTotals } from '../../types/food-log.types'
import { AddFoodProgress } from '../FoodLogPage'

export type BannerSettings = Pick<
  FoodLogSettings,
  | 'loggerBannerShowCalories'
  | 'loggerBannerShowProtein'
  | 'loggerBannerShowFat'
  | 'loggerBannerShowCarbs'
  | 'loggerBannerDisplay'
>

/** Dữ liệu mẫu: mục tiêu 2467 kcal / 91P / 82F / 339C, chưa log gì trong ngày, plate có 600 kcal / 56P / 15F / 63C. */
const TARGET = {
  caloriesTarget: 2467,
  proteinTarget: 91,
  fatTarget: 82,
  carbsTarget: 339,
} as never
const DAY: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
const PLATE: MacroTotals = { calories: 600, protein: 56, carbs: 63, fat: 15, fiber: 0 }

const CIRCLE = 'bg-secondary flex size-11 shrink-0 items-center justify-center rounded-full'

/** Banner đầu bảng Thêm món dựng lại với dữ liệu mẫu để xem trước cài đặt: nút đóng, giờ, tiến độ, plate (+3) và nút lên. */
export function BannerPreview({ settings }: { readonly settings: BannerSettings }) {
  return (
    <section aria-label="Preview" className="space-y-3">
      <h2 className="text-xl font-bold">Preview</h2>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={CIRCLE}>
          <X className="size-5" />
        </span>
        <span
          aria-hidden="true"
          className="bg-secondary flex h-11 shrink-0 flex-col items-center justify-center rounded-full px-3 text-center leading-tight"
        >
          <span className="text-sm">19:00</span>
          <span className="text-muted-foreground text-xs">15 thg 10</span>
        </span>
        <AddFoodProgress
          totals={DAY}
          target={TARGET}
          plate={PLATE}
          show={{
            calories: settings.loggerBannerShowCalories,
            protein: settings.loggerBannerShowProtein,
            fat: settings.loggerBannerShowFat,
            carbs: settings.loggerBannerShowCarbs,
          }}
          display={settings.loggerBannerDisplay}
        />
        <span
          aria-hidden="true"
          className="bg-background flex h-11 shrink-0 items-center gap-1.5 rounded-full pr-1 pl-3 text-sm"
        >
          🍔 <span className="text-muted-foreground">+3</span>
          <span className={CIRCLE}>
            <ArrowUp className="size-5" />
          </span>
        </span>
      </div>
    </section>
  )
}
