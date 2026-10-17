'use client'

import { TileOptionSections, TilePreview } from '../components/FoodLogSettingsPage'
import {
  FOOD_LOG_CHOICES,
  timelineTileOptions,
  type FoodLogSettings,
  type TileOptions,
} from '../food-log-settings'
import { useFoodLogSettings } from '../hooks/use-food-log-settings'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'

/**
 * "Timeline Food Tiles" (Food Log → điều chỉnh): preview ghim ở đầu trang đổi ngay theo lựa chọn bên dưới — Tile Density
 * (Comfort / Standard / Compact), Display Information (Macros, Weight, Serving) và Highlight Element (Edit / Energy / None).
 * Lưu qua `PUT /food-logs/settings`.
 */
export function TimelineFoodTilesPage() {
  const [settings, update] = useFoodLogSettings()
  const options = timelineTileOptions(settings)

  const change = (patch: Partial<TileOptions>) => {
    const next: Partial<FoodLogSettings> = {}
    if (patch.density) next.timelineTileDensity = patch.density
    if (patch.showMacros !== undefined) next.timelineShowMacros = patch.showMacros
    if (patch.showWeight !== undefined) next.timelineShowWeight = patch.showWeight
    if (patch.showServing !== undefined) next.timelineShowServing = patch.showServing
    if (patch.highlight)
      next.timelineHighlight = patch.highlight as FoodLogSettings['timelineHighlight']
    update(next)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-8">
      <div className="bg-card sticky top-0 z-30 space-y-4 px-4 pb-4 [contain:inline-size] max-md:-mx-4 max-md:-mt-[calc(env(safe-area-inset-top)+1.25rem)] max-md:pt-[calc(env(safe-area-inset-top)+0.5rem)] md:rounded-2xl md:pt-2">
        <SubPageHeader title="Timeline Food Tiles" />
        <TilePreview settings={options} />
      </div>
      <TileOptionSections
        options={options}
        highlightChoices={FOOD_LOG_CHOICES.timelineHighlight}
        onChange={change}
      />
    </div>
  )
}
