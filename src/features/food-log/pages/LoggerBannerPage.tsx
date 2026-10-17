'use client'

import { BannerPreview, OptionList, ToggleList } from '../components/FoodLogSettingsPage'
import { FOOD_LOG_CHOICES, type FoodLogSettings } from '../food-log-settings'
import { useFoodLogSettings } from '../hooks/use-food-log-settings'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'

type NutrientKey =
  | 'loggerBannerShowCalories'
  | 'loggerBannerShowProtein'
  | 'loggerBannerShowFat'
  | 'loggerBannerShowCarbs'

const NUTRIENTS: readonly { key: NutrientKey; label: string }[] = [
  { key: 'loggerBannerShowCalories', label: 'Calories' },
  { key: 'loggerBannerShowProtein', label: 'Protein' },
  { key: 'loggerBannerShowFat', label: 'Fat' },
  { key: 'loggerBannerShowCarbs', label: 'Carbs' },
]

/**
 * "Customize Banner" (Food Log → điều chỉnh → Logger Banner): preview ghim ở đầu trang đổi ngay theo công tắc Nutrients
 * (Calories, Protein, Fat, Carbs) và Nutrition Display (chỉ plate / cả ngày + plate / còn lại sau plate). Lưu qua
 * `PUT /food-logs/settings`; banner thật nằm ở đầu bảng Thêm món.
 */
export function LoggerBannerPage() {
  const [settings, update] = useFoodLogSettings()

  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-8">
      <div className="bg-card sticky top-0 z-30 space-y-4 px-4 pb-4 [contain:inline-size] max-md:-mx-4 max-md:-mt-[calc(env(safe-area-inset-top)+1.25rem)] max-md:pt-[calc(env(safe-area-inset-top)+0.5rem)] md:rounded-2xl md:pt-2">
        <SubPageHeader title="Customize Banner" />
        <BannerPreview settings={settings} />
      </div>

      <section aria-label="Nutrients" className="space-y-3">
        <h2 className="text-xl font-bold">Nutrients</h2>
        <ToggleList
          label="Nutrients"
          items={NUTRIENTS.map(({ key, label }) => ({ key, label, checked: settings[key] }))}
          onToggle={(key, checked) => update({ [key]: checked })}
        />
      </section>

      <section aria-label="Nutrition Display" className="space-y-3">
        <h2 className="text-xl font-bold">Nutrition Display</h2>
        <OptionList
          label="Nutrition Display"
          options={FOOD_LOG_CHOICES.loggerBannerDisplay}
          value={settings.loggerBannerDisplay}
          onChange={(value) =>
            update({ loggerBannerDisplay: value as FoodLogSettings['loggerBannerDisplay'] })
          }
        />
      </section>
    </div>
  )
}
