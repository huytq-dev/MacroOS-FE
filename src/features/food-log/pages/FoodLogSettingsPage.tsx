'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  ChoiceSheet,
  HourRangeSheet,
  OptionList,
  SettingRow,
  SettingsSection,
} from '../components/FoodLogSettingsPage'
import {
  FOOD_LOG_CHOICES,
  FOOD_LOG_SUBTITLE,
  hourLabel,
  type FoodLogSettings,
  type SettingChoice,
} from '../food-log-settings'
import { useFoodLogSettings } from '../hooks/use-food-log-settings'
import { SubPageHeader } from '@/features/dashboard/components/DashboardPage'
import { routePath } from '@/config/route-path'

type ChoiceKey = keyof typeof FOOD_LOG_CHOICES

/** Hàng "Edit" dạng chọn một: [khoá cài đặt, tiêu đề]. Thứ tự và tiêu đề theo MacroFactor. */
const TIMELINE_ROWS: readonly (readonly [ChoiceKey, string])[] = [
  ['alignment', 'Alignment'],
  ['addFoodsToHour', 'Add Foods to Hour'],
  ['showTimestamps', 'Food Timestamps'],
  ['showHourlyTotals', 'Hourly Macro Totals'],
  ['weekBanner', 'Calendar Week Banner'],
  ['calendarScrolling', 'Calendar Scrolling'],
  ['premoveEnabled', 'Premove'],
]
const SEARCH_ROWS: readonly (readonly [ChoiceKey, string])[] = [
  ['showBrandedResults', 'Branded Results'],
  ['showOpenFoodFactsResults', 'Open Food Facts Results'],
]
const LOGGER_LINKS = [
  ['Time Selection', 'Choose how you change time while logging'],
  ['Favorite Measurements', 'Select the measurements to pin to serving size selection'],
] as const

const PREVIEW_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/** Dải tuần minh hoạ phía trên các lựa chọn của Calendar Week Banner (viên thuốc viền xanh như MacroFactor). */
function WeekBannerPreview() {
  return (
    <div aria-hidden="true" className="flex justify-between px-4 py-5">
      {PREVIEW_DAYS.map((label, index) => (
        <span
          key={label}
          className="border-mf-tile-calories flex h-[3.75rem] w-11 flex-col items-center justify-center rounded-full border-2"
        >
          <span className="text-lg leading-none">{index + 1}</span>
          <span className="text-muted-foreground mt-1 text-sm leading-none">{label}</span>
        </span>
      ))}
    </div>
  )
}

const titleOf = (key: ChoiceKey) =>
  [...TIMELINE_ROWS, ...SEARCH_ROWS, ['optimization', 'Optimization'] as const].find(
    ([rowKey]) => rowKey === key
  )?.[1] ?? 'Food Log'

/** Nhãn của giá trị đang chọn (hiện dưới tiêu đề dòng). */
const currentLabel = (key: ChoiceKey, settings: FoodLogSettings) =>
  (FOOD_LOG_CHOICES[key] as readonly SettingChoice<string>[]).find(
    (choice) => choice.value === String(settings[key])
  )?.label ?? ''

/**
 * Cài đặt Food Log (bấm nút điều chỉnh ở đầu Food Log): Nutrient Reporting, Timeline Options, Food Search, Food Tiles và
 * Logger Options. Mỗi dòng "Edit" mở bảng chọn một; lưu trên thiết bị. Các trang con (Food Tiles, Logger) chưa có.
 */
export function FoodLogSettingsPage() {
  const [settings, update] = useFoodLogSettings()
  const [editing, setEditing] = useState<ChoiceKey | 'hourRange' | null>(null)
  const comingSoon = () => toast('This setting is coming soon')

  /** Cờ bool trong bảng chọn dùng giá trị chuỗi 'true' / 'false'; còn lại là chuỗi enum của BE. */
  const choose = (key: ChoiceKey, value: string) =>
    update({ [key]: typeof settings[key] === 'boolean' ? value === 'true' : value })

  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-8">
      <SubPageHeader title="Food Log" />

      <section aria-label="Nutrient Reporting" className="space-y-3">
        <h2 className="text-xl font-bold">Nutrient Reporting</h2>
        <OptionList
          label="Nutrient Reporting"
          options={FOOD_LOG_CHOICES.overages}
          value={settings.overages}
          onChange={(value) => choose('overages', value)}
        />
      </section>

      <SettingsSection title="Timeline Options">
        <SettingRow
          title="Hour Range"
          detail={`${hourLabel(settings.hourRangeFirst)} - ${hourLabel(settings.hourRangeLast)}`}
          onEdit={() => setEditing('hourRange')}
        />
        {TIMELINE_ROWS.map(([key, title]) => (
          <SettingRow
            key={key}
            title={title}
            detail={currentLabel(key, settings)}
            onEdit={() => setEditing(key)}
          />
        ))}
      </SettingsSection>

      <SettingsSection title="Food Search">
        {SEARCH_ROWS.map(([key, title]) => (
          <SettingRow
            key={key}
            title={title}
            detail={currentLabel(key, settings)}
            onEdit={() => setEditing(key)}
          />
        ))}
      </SettingsSection>

      <SettingsSection title="Food Tiles">
        <SettingRow
          title="Timeline Food Tiles"
          detail="Customize how foods appear in your timeline"
          href={routePath.foodLogTimelineTiles}
        />
        <SettingRow
          title="Logger Food Tiles"
          detail="Customize how foods appear in search"
          href={routePath.foodLogLoggerTiles}
        />
      </SettingsSection>

      <SettingsSection title="Logger Options">
        <SettingRow
          title="Logger Banner"
          detail="Customize the top of your plate"
          href={routePath.foodLogLoggerBanner}
        />
        {LOGGER_LINKS.map(([title, detail]) => (
          <SettingRow key={title} title={title} detail={detail} onOpen={comingSoon} />
        ))}
        <SettingRow
          title="Optimization"
          detail={currentLabel('optimization', settings)}
          onEdit={() => setEditing('optimization')}
        />
      </SettingsSection>

      {editing === 'hourRange' && (
        <HourRangeSheet
          open
          onOpenChange={(open) => !open && setEditing(null)}
          value={{ first: settings.hourRangeFirst, last: settings.hourRangeLast }}
          onSave={(range) => update({ hourRangeFirst: range.first, hourRangeLast: range.last })}
        />
      )}
      {editing && editing !== 'hourRange' && (
        <ChoiceSheet
          open
          onOpenChange={(open) => !open && setEditing(null)}
          title={titleOf(editing)}
          subtitle={FOOD_LOG_SUBTITLE[editing]}
          preview={editing === 'weekBanner' ? <WeekBannerPreview /> : undefined}
          choices={FOOD_LOG_CHOICES[editing]}
          value={String(settings[editing])}
          onSelect={(value) => choose(editing, value)}
        />
      )}
    </div>
  )
}
