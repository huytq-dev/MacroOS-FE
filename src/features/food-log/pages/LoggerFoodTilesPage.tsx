'use client'

import { TileOptionSections, TilePreview } from '../components/FoodLogSettingsPage'
import {
  FOOD_LOG_CHOICES,
  loggerTileOptions,
  type FoodLogSettings,
  type TileOptions,
} from '../food-log-settings'
import { useFoodLogSettings } from '../hooks/use-food-log-settings'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'

/**
 * "Logger Food Tiles" (Food Log → điều chỉnh): cách món hiện trong kết quả tìm kiếm của bảng Thêm món. Preview dạng dòng
 * phẳng ghim ở đầu trang; Highlight Element là Multi-Add (nút + thêm vào plate) / Energy / None. Lưu qua
 * `PUT /food-logs/settings`.
 */
export function LoggerFoodTilesPage() {
  const [settings, update] = useFoodLogSettings()
  const options = loggerTileOptions(settings)

  const change = (patch: Partial<TileOptions>) => {
    const next: Partial<FoodLogSettings> = {}
    if (patch.density) next.loggerTileDensity = patch.density
    if (patch.showMacros !== undefined) next.loggerShowMacros = patch.showMacros
    if (patch.showWeight !== undefined) next.loggerShowWeight = patch.showWeight
    if (patch.showServing !== undefined) next.loggerShowServing = patch.showServing
    if (patch.highlight)
      next.loggerHighlight = patch.highlight as FoodLogSettings['loggerHighlight']
    update(next)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-8">
      <div className="bg-card sticky top-0 z-30 space-y-4 px-4 pb-4 [contain:inline-size] max-md:-mx-4 max-md:-mt-[calc(env(safe-area-inset-top)+1.25rem)] max-md:pt-[calc(env(safe-area-inset-top)+0.5rem)] md:rounded-2xl md:pt-2">
        <SubPageHeader title="Logger Food Tiles" />
        <TilePreview settings={options} variant="logger" />
      </div>
      <TileOptionSections
        options={options}
        highlightChoices={FOOD_LOG_CHOICES.loggerHighlight}
        onChange={change}
      />
    </div>
  )
}
